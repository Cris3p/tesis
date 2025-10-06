const contactosModel = require("../models/contactosModel");

exports.agregarContacto = async (req, res) => {
    try {
        const { id_usuario, contacto } = req.body;
        await contactosModel.agregarContacto(id_usuario, contacto);
        res.status(201).json({ message: "Contacto agregado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al agregar contacto" });
    }
};

exports.getContactosByUsuario = async (req, res) => {
    try {
        const { id_usuario } = req.params;
        const contactos = await contactosModel.getContactosByUsuario(id_usuario);
        res.json(contactos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener contactos" });
    }
};

exports.eliminarContacto = async (req, res) => {
    try {
        const { id } = req.params;
        await contactosModel.eliminarContacto(id);
        res.json({ message: "Contacto eliminado" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al eliminar contacto" });
    }
};
