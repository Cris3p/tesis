const Peach = require('../../lib/peach/Peach.js');

class historialController {
    static show(req, res) {
        try {
            const view = new Peach("historial");
            res.status(200).send(view.bufferTpl);
        } catch (error) {
            res.status(404).send('Página no encontrada');
        }
    }
}

module.exports = historialController;