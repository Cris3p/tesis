const Peach = require('../../lib/peach/Peach.js');

class perfilController {
    static show(req, res) {
        try {
            const view = new Peach("perfil");
            res.status(200).send(view.bufferTpl);
        } catch (error) {
            res.status(404).send('Página no encontrada');
        }
    }
}

module.exports = perfilController;