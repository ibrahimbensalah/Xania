System.config({
    packages: {
        src: {
            defaultExtension: "js"
        }
    }
});

System.import("spec/compilerSpec.js").then(() => {
    System.import("spec/templateSpec.js").then(window.onload);
});
