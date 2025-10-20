const Peach = require('../../lib/peach/Peach.js');

class errorController {
    static show(req, res) {
        try {
            const view = new Peach("error");
            res.status(404).send(view.bufferTpl);
        } catch (error) {
            res.status(404).send('Página no encontrada');
        }
    }
}

module.exports = errorController;