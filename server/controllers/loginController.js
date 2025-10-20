const Peach = require('../../lib/peach/Peach.js');

class loginController {
    static show(req, res) {
        try {
            const view = new Peach("login");
            res.status(200).send(view.bufferTpl);
        } catch (error) {
            res.status(404).send('Página no encontrada');
        }
    }
}

module.exports = loginController;