using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using iTextSharp.text;
using iTextSharp.text.pdf;
using iTextSharp.text.pdf.codec;

namespace Xania.TemplateJS.Reporting
{
    public class InvoiceReport
    {
        public byte[] Generate(InvoiceReportDataTO reportData)
        {
            System.Threading.Thread.CurrentThread.CurrentCulture = new CultureInfo("nl-NL");
            var document = new Document(PageSize.A4, 50, 50, 25, 25);

            // Create a new PdfWriter object, specifying the output stream
            var output = new MemoryStream();
            var writer = PdfWriter.GetInstance(document, output);

            var baseFont = GetBaseFont();

            // Open the Document for writing
            document.Open();

            CreateInvoiceFooter(writer, baseFont, reportData.Sender);

            document.Add(GetImage("logo.png", 15));

            var font = new Font(baseFont)
            {
                Color = new BaseColor(77, 77, 77)
            };
            var headerTable = new PdfPTable(2)
            {
                WidthPercentage = 100,
                DefaultCell = { Border = 0, Padding = 0, PaddingTop = 20, PaddingBottom = 20 }
            };

            headerTable.AddCell(new Paragraph("", font)
                {
                    new Phrase("FACTUUR\r\n", font.WithSize(14).WithBold()),
                    new Phrase("\r\n" + reportData.Company.AddressLines.Join("\r\n"),
                        font.WithSize(12).WithColor(100, 100, 100))
                });
            headerTable.AddCell(InvoiceProperties(reportData.Invoice, font.BaseFont));
            document.Add(headerTable);

            document.Add(new Paragraph(reportData.Invoice.Description + "\r\n ", font));

            var container = InvoiceItemsContainer();
            container.AddCell(InvoiceItems(reportData.Invoice.LineItems, font.WithSize(10)));
            document.Add(container);

            var invoice = reportData.Invoice;
            var sender = reportData.Sender;
            document.Add(new Paragraph(
                $"U wordt vriendelijk verzocht het bedrag van {invoice.TotalAmountInclTax,2:C} " +
                $"uiterlijk {invoice.ExpirationDate:d} over te maken op {sender.BankAccount} ten name van {sender.Name}",
                font));

            document.Close();

            return output.GetBuffer();
        }
        private void CreateInvoiceFooter(PdfWriter writer, BaseFont baseFont, SenderTO sender)
        {
            PdfContentByte cb = writer.DirectContent;
            cb.BeginText();
            cb.SetTextMatrix(65, 47);
            cb.SetFontAndSize(baseFont, 10);
            cb.ShowText($"{sender.Name} | Laan van Kronenburg 14 1183 AS Amstelveen | ibrahim.bensalah@gmail.com");
            cb.SetTextMatrix(65, 34);
            cb.SetFontAndSize(baseFont, 10);
            cb.ShowText($"{sender.BankAccount} | BTW NL132281880B01 | K.v.K 34236468");
            cb.EndText();

            var png = GetImage("blue.png", 9);
            png.SetAbsolutePosition(33, 32);
            cb.AddImage(png);
            // cb.AddImage();

        }

        private static PdfPTable InvoiceItemsContainer()
        {
            return new PdfPTable(1)
            {
                DefaultCell =
                {
                    Border = 0,
                    BackgroundColor = new BaseColor(240, 240, 240),
                    Padding = 30,
                    PaddingTop = 20
                },
                WidthPercentage = 110
            };
        }

        private static PdfPTable InvoiceItems(IEnumerable<LineItemTO> invoiceLineItems, Font font)
        {
            var table = new PdfPTable(4)
            {
                DefaultCell = { Border = 0 }
            };

            table.AddCell("Omschrijving".Cell(font).Padding(4, 10));
            table.AddCell("Uren".Cell(font).Padding(4, 10));
            table.AddCell("Bedrag".Cell(font).Padding(4, 10));
            table.AddCell("BTW".Cell(font).Padding(4, 10));
            table.SetWidths(new int[] { 100, 50, 50, 50 });

            foreach (var lineItem in invoiceLineItems)
            {
                var time = TimeSpan.FromHours(lineItem.Count);
                var hours = (int)time.TotalHours;
                var minutes = time.Minutes;

                table.AddCell(lineItem.Description.Cell(font).Border(1).Padding(4, 10).PaddingBottom(6));
                table.AddCell($"{hours}h {minutes}m".Cell(font).Border(1).Padding(4, 10).PaddingBottom(6));
                table.AddCell($"{lineItem.UnitPrice * (decimal)lineItem.Count,2:C}".Cell(font).Border(1).Padding(4, 10).PaddingBottom(6));
                table.AddCell($"{lineItem.UnitPrice * lineItem.Tax * (decimal)lineItem.Count,2:C}".Cell(font).Border(1).Padding(4, 10).PaddingBottom(6));
            }
            return table;
        }


        private static PdfPTable InvoiceProperties(InvoiceTO invoice, BaseFont baseFont)
        {
            var headFont = new Font(baseFont)
            {
                Size = 12,
                Color = new BaseColor(130, 130, 130)
            };
            var valueFont = new Font(baseFont);

            var table = new PdfPTable(2)
            {
                TotalWidth = 200
            };

            Func<string, PdfPCell> headerCell =
                text => new PdfPCell(new Phrase(text, headFont)).Border(0).AlignRight().Padding(1, 6);

            table.AddCell(headerCell("Factuur nr"));
            table.AddCell(invoice.InvoiceNumber.Cell(valueFont).Border(0).Padding(1, 6));

            var dutch = new CultureInfo("nl-NL");
            table.AddCell(headerCell("Datum"));
            table.AddCell(invoice.InvoiceDate.ToString("dd MMM yyyy", dutch).Cell(valueFont).Border(0).Padding(1, 6));

            table.AddCell(headerCell("Vervaldatum"));
            table.AddCell(invoice.ExpirationDate.ToString("dd MMM yyyy", dutch).Cell(valueFont).Border(0).Padding(1, 6));

            table.AddCell(headerCell("Excl btw"));
            table.AddCell(invoice.TotalAmountExclTax.ToString("C2").Cell(valueFont).Border(0).Padding(1, 6));

            table.AddCell(headerCell("Btw"));
            table.AddCell(invoice.TotalTax.ToString("C2").Cell(valueFont).Border(0).Padding(1, 6));

            table.AddCell(headerCell("Totaal"));
            table.AddCell(invoice.TotalAmountInclTax.ToString("C2").Cell(valueFont).Border(0).Padding(1, 6));
            return table;
        }

        public static Stream GetResource(string name)
        {
            return typeof(InvoiceReport).Assembly.GetManifestResourceStream(
                GetResourceName(name));
        }

        public static string GetResourceName(string name)
        {
            return typeof(InvoiceReport).Assembly.GetManifestResourceNames()
                .Single(e => e.EndsWith(name, StringComparison.OrdinalIgnoreCase));
        }

        public static Image GetImage(string name, int scale)
        {
            using (var imageStream = GetResource(name))
            {
                var png = PngImage.GetImage(imageStream);
                png.ScalePercent(scale);

                return png;
            }
        }

        private BaseFont GetBaseFont()
        {
            var fontStream = new MemoryStream();
            GetResource("roboto.regular.ttf").CopyTo(fontStream);
            return BaseFont.CreateFont("roboto.regular.ttf", BaseFont.CP1252, BaseFont.EMBEDDED, true,
                fontStream.GetBuffer(), null);
        }
    }

    public static class FormattingExtensions
    {
        public static string Join(this string[] arr, string separator)
        {
            return string.Join(separator, arr);
        }

        public static PdfPCell Cell(this string text, Font font)
        {
            return new PdfPCell(new Phrase(text, font))
            {
                Border = 0
            };
        }

        public static PdfPCell Cell(this string text)
        {
            return new PdfPCell(new Phrase(text));
        }

        public static PdfPCell AlignRight(this PdfPCell cell)
        {
            cell.HorizontalAlignment = Element.ALIGN_RIGHT;
            return cell;
        }

        public static PdfPCell Border(this PdfPCell cell, int borderWidth)
        {
            cell.BorderWidthTop = borderWidth;
            cell.BorderWidthLeft = borderWidth;
            cell.BorderWidthBottom = borderWidth;
            cell.BorderWidthRight = borderWidth;

            cell.BorderColor = new BaseColor(200, 200, 200);
            return cell;
        }

        public static PdfPCell Padding(this PdfPCell cell, float topBottom, float leftRight)
        {
            cell.PaddingTop = topBottom;
            cell.PaddingBottom = topBottom;
            cell.PaddingLeft = leftRight;
            cell.PaddingRight = leftRight;
            return cell;
        }

        public static PdfPCell PaddingRight(this PdfPCell cell, float value)
        {
            cell.PaddingRight = value;
            return cell;
        }

        public static PdfPCell PaddingBottom(this PdfPCell cell, float value)
        {
            cell.PaddingBottom = value;
            return cell;
        }

        public static Font WithSize(this Font font, int size)
        {
            return new Font(font.BaseFont, size);
        }

        public static Font WithColor(this Font font, int red, int green, int blue)
        {
            return new Font(font.BaseFont)
            {
                Color = new BaseColor(red, green, blue)
            };
        }

        public static Font WithBold(this Font font)
        {
            return new Font(font.BaseFont, font.Size, Font.BOLD)
            {
            };
        }
    }
}
