const Peach = require('../../lib/peach/Peach.js');

class registroController {
    static show(req, res) {
        try {
            const view = new Peach("registro");
            res.status(200).send(view.bufferTpl);
        } catch (error) {
            res.status(404).send('Página no encontrada');
        }
    }
}

module.exports = registroController;