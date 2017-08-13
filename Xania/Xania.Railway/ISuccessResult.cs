using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Xania.Railway
{
    public interface ISuccessResult<out T>
    {
        T Value { get; }
    }
}
