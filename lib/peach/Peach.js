const fs = require("fs");
const path = require("path");

class Peach {

    constructor(nameView) {
        // Carga de la vista
        this.bufferTpl = fs.readFileSync(
            path.join(__dirname, '..', '..', 'public', 'html', `${nameView}.html`),
            "utf8"
        );

        // Sección para cargar componentes
        let componentContent = fs.readFileSync(
            path.join(__dirname, "../../public/html/components/headComponent.html"),
            "utf8"
        );

        this.bufferTpl = this.bufferTpl.replace(
            "@component(head)",
            componentContent
        );

        componentContent = fs.readFileSync(
            path.join(__dirname, "../../public/html/components/footerComponent.html"),
            "utf8"
        );

        this.bufferTpl = this.bufferTpl.replace(
            "@component(footer)",
            componentContent
        );

        // Reemplaza variables de plantilla con valores de constantes
        this.assign({
            APP_NAME: process.env.APP_NAME,
            APP_DESCRIPTION: process.env.APP_DESCRIPTION || "Descripción de la app",
            APP_AUTHOR: process.env.APP_AUTHOR || "Autor",            
        });
    }

    // Reemplaza variables {{ VAR }} en la plantilla
    assign(arrayAssoc) {
        for (const [key, value] of Object.entries(arrayAssoc)) {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
            this.bufferTpl = this.bufferTpl.replace(regex, value);
        }
    }

    // Imprime en pantalla
    printToScreen() {
        console.log(this.bufferTpl);
    }
}

module.exports = Peach;