const contactosModel = require("../models/contactosModel");

function validarYNormalizarTelefono(telefono) {
    // Limpiar el número (solo dígitos)
    let numeroLimpio = String(telefono || "").replace(/[^\d]/g, "");
    console.log(`Validando teléfono: "${telefono}" → "${numeroLimpio}"`);
    
    // Validaciones básicas
    if (numeroLimpio.length === 0) {
        return { valido: false, error: "El número no puede estar vacío" };
    }
    
    // Remover código de país si existe
    if (numeroLimpio.startsWith("54")) {
        numeroLimpio = numeroLimpio.substring(2);
    }
    
    // Remover 0 inicial
    if (numeroLimpio.startsWith("0")) {
        numeroLimpio = numeroLimpio.substring(1);
    }
    
    // Remover 15 si está al inicio
    if (numeroLimpio.startsWith("15")) {
        numeroLimpio = numeroLimpio.substring(2);
    }
    
    // Validar longitud (debe ser 10 dígitos para Argentina)
    if (numeroLimpio.length < 10) {
        return { 
            valido: false, 
            error: `Número muy corto (${numeroLimpio.length} dígitos). Debe tener 10 dígitos (código de área + número)` 
        };
    }
    
    if (numeroLimpio.length > 10) {
        console.warn(`Número largo (${numeroLimpio.length} dígitos), recortando a 10`);
        numeroLimpio = numeroLimpio.substring(0, 10);
    }
    
    // Validar que empiece con código de área válido
    const primerDigito = numeroLimpio.charAt(0);
    if (primerDigito !== '1' && primerDigito !== '2' && primerDigito !== '3') {
        return { 
            valido: false, 
            error: `Código de área no reconocido. Debe empezar con 11 (CABA) o 2XX/3XX (interior)` 
        };
    }
    
    return { 
        valido: true, 
        numeroNormalizado: numeroLimpio
    };
}

// Función para validar nombre
function validarNombre(nombre) {
    if (!nombre || nombre.trim().length === 0) {
        return { valido: false, error: "El nombre no puede estar vacío" };
    }
    
    if (nombre.trim().length < 2) {
        return { valido: false, error: "El nombre es muy corto (mínimo 2 caracteres)" };
    }
    
    if (nombre.length > 60) {
        return { valido: false, error: "El nombre es muy largo (máximo 60 caracteres)" };
    }
    
    return { valido: true, nombreNormalizado: nombre.trim() };
}

exports.agregarContacto = async (req, res) => {
    try {
        const { id_usuario, contacto, nombre } = req.body;
        
        if (!id_usuario || isNaN(id_usuario)) {
            return res.status(400).json({ 
                message: "ID de usuario inválido" 
            });
        }
        
        const validacionNombre = validarNombre(nombre);
        if (!validacionNombre.valido) {
            return res.status(400).json({ 
                message: validacionNombre.error 
            });
        }
        
        const validacionTelefono = validarYNormalizarTelefono(contacto);
        if (!validacionTelefono.valido) {
            return res.status(400).json({ 
                message: validacionTelefono.error 
            });
        }
        
        const contactoExistente = await contactosModel.verificarContactoExistente(
            id_usuario, 
            validacionTelefono.numeroNormalizado
        );
        
        if (contactoExistente) {
            return res.status(400).json({ 
                message: "Este número de teléfono ya está registrado como contacto" 
            });
        }
        
        await contactosModel.agregarContacto(
            id_usuario, 
            validacionTelefono.numeroNormalizado, 
            validacionNombre.nombreNormalizado
        );
        
        console.log(`Contacto agregado: ${validacionNombre.nombreNormalizado} - ${validacionTelefono.numeroNormalizado}`);
        
        res.status(201).json({ 
            message: "Contacto agregado correctamente",
            contacto: {
                nombre: validacionNombre.nombreNormalizado,
                telefono: validacionTelefono.numeroNormalizado
            }
        });
    } catch (error) {
        console.error("Error al agregar contacto:", error);
        res.status(500).json({ message: "Error al agregar contacto" });
    }
};

exports.getContactosByUsuario = async (req, res) => {
    try {
        const { id_usuario } = req.params;
        
        if (!id_usuario || isNaN(id_usuario)) {
            return res.status(400).json({ 
                message: "ID de usuario inválido" 
            });
        }
        
        const contactos = await contactosModel.getContactosByUsuario(id_usuario);
        
        console.log(`Contactos obtenidos para usuario ${id_usuario}: ${contactos.length}`);
        
        res.json(contactos);
    } catch (error) {
        console.error("Error al obtener contactos:", error);
        res.status(500).json({ message: "Error al obtener contactos" });
    }
};

exports.eliminarContacto = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id || isNaN(id)) {
            return res.status(400).json({ 
                message: "ID de contacto inválido" 
            });
        }
        const contactoExiste = await contactosModel.verificarContactoExistePorId(id);
        
        if (!contactoExiste) {
            return res.status(404).json({ 
                message: "Contacto no encontrado" 
            });
        }
        
        await contactosModel.eliminarContacto(id);
        
        console.log(`Contacto eliminado: ID ${id}`);
        
        res.json({ message: "Contacto eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar contacto:", error);
        res.status(500).json({ message: "Error al eliminar contacto" });
    }
};

exports.actualizarContacto = async (req, res) => {
    try {
        const { id } = req.params;
        const { contacto, nombre } = req.body;
        
        if (!id || isNaN(id)) {
            return res.status(400).json({ 
                message: "ID de contacto inválido" 
            });
        }
        
        const contactoExiste = await contactosModel.verificarContactoExistePorId(id);
        
        if (!contactoExiste) {
            return res.status(404).json({ 
                message: "Contacto no encontrado" 
            });
        }
        
        const validacionNombre = validarNombre(nombre);
        if (!validacionNombre.valido) {
            return res.status(400).json({ 
                message: validacionNombre.error 
            });
        }
        
        const validacionTelefono = validarYNormalizarTelefono(contacto);
        if (!validacionTelefono.valido) {
            return res.status(400).json({ 
                message: validacionTelefono.error 
            });
        }
        
        await contactosModel.actualizarContacto(
            id, 
            validacionTelefono.numeroNormalizado, 
            validacionNombre.nombreNormalizado
        );
        
        console.log(`Contacto actualizado: ID ${id} - ${validacionNombre.nombreNormalizado} - ${validacionTelefono.numeroNormalizado}`);
        
        res.json({ 
            message: "Contacto actualizado correctamente",
            contacto: {
                nombre: validacionNombre.nombreNormalizado,
                telefono: validacionTelefono.numeroNormalizado
            }
        });
    } catch (error) {
        console.error("Error al actualizar contacto:", error);
        res.status(500).json({ message: "Error al actualizar contacto" });
    }
};

module.exports = exports;