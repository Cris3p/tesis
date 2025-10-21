const palabrasOfensivas = [
    'puto', 'puta', 'pute', 'pendejo', 'pendeja', 'pendeje', 'concha', 'conchuda', 
    'pelotudo', 'pelotuda', 'boludo', 'boluda', 'forro', 'forra', 'hijo de puta',
    'la concha', 'mierda', 'carajo', 'verga', 'chingar', 'joder', 'coger', 'cojer',
    'culo', 'orto', 'pitote', 'pilin', 'mamada',
    'pija', 'pingo', 'choto', 'garca', 'sorete',
    'mogolico', 'mogolica', 'retrasado', 'retrasada', 'tarado', 'tarada',
    'idiota', 'imbecil', 'estupido', 'estupida', 'cretino', 'cretina',
    'marica', 'maricon', 'trolo', 'puto de mierda', 'concha de tu madre',
    'la puta madre', 'me cago', 'chupa', 'mamador', 'pete', 'garcha',
    
    'p3ndejo', 'p3ndeja', 'put0', 'put4', 'pvta', 'pvto',
    'p3l0tud0', 'p3l0tud4', 'b0lud0', 'b0lud4', 'f0rr0', 'f0rr4',
    'c0nch4', 'm13rd4', 'c4raj0', 'v3rg4', 'ch1ng4r',
    'c0g3r', 'c0j3r', 'cul0', '0rt0', 'p1j4', 'p1ng0',
    'ch0t0', 's0r3t3', 'm0g0l1c0', 'r3tras4d0', 't4r4d0',
    '1d10t4', '1mb3c1l', '3stup1d0', 'cr3t1n0', 'm4r1c4',
    'tr0l0', 'p3t3', 'g4rch4','lcdtm', 'lcdll', 'lpm',
    'lpqtp', 'lpqp', 'hdp', 'hdrmp',
    'ptm', 'ctm', 'qlp', 'lrpm', 'conchudo', 'hp', 'pm',
    'fk', 'wtf', 'stfu', 'gtfo',
    'gil', 'gila', 'nabo', 'nabito', 'chanta', 'vago', 'vaga',
    'salame', 'banana', 'tarado', 'negro de mierda', 'villero',
    
    // Palabras con caracteres especiales
    'p*t*', 'p@t@', 'p.u.t.a', 'c0nch@', 'm!erda',
    'p3nd3j0', 'b0lud@', 'f0rr@',
];

// Patrones regex para detectar variaciones
const patronesOfensivos = [
    /p+[u0]+t+[o0a4@]+/gi,
    /p+[e3]+n+d+[e3]+j+[o0a4@]+/gi,
    /c+[o0]+n+c+h+[a4@]+/gi,
    /p+[e3]+l+[o0]+t+[u0]+d+[o0a4@]+/gi,
    /b+[o0]+l+[u0]+d+[o0a4@]+/gi,
    /f+[o0]+r+r+[o0a4@]+/gi,
    /m+[i1!]+[e3]+r+d+[a4@]+/gi,
    /c+[a4@]+r+[a4@]+j+[o0]+/gi,
    /v+[e3]+r+g+[a4@]+/gi,
    /c+[u0]+l+[o0]+/gi,
    /[o0]+r+t+[o0]+/gi,
    /p+[i1!]+j+[a4@]+/gi,
    /ch+[o0]+t+[o0]+/gi,
    /s+[o0]+r+[e3]+t+[e3]+/gi,
    /[i1!]+d+[i1!]+[o0]+t+[a4@]+/gi,
    /[i1!]+m+b+[e3]+c+[i1!]+l+/gi,
    /[e3]+s+t+[u0]+p+[i1!]+d+[o0a4@]+/gi,
    /m+[a4@]+r+[i1!]+c+[a4@]+/gi,
    /g+[a4@]+r+c+h+[a4@]+/gi,
    /p+[e3]+t+[e3]+/gi,
];

/**
 * Normaliza texto para comparación
 */
function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Elimina acentos
        .replace(/[^a-z0-9\s]/gi, '') // Elimina símbolos especiales
        .trim();
}

/**
 * Verifica si el texto contiene lenguaje ofensivo
 */
function contieneLenguajeOfensivo(texto) {
    if (!texto || texto.trim().length === 0) {
        return false;
    }

    const textoNormalizado = normalizarTexto(texto);
    const textoOriginal = texto.toLowerCase();

    // Verificar palabras exactas
    for (const palabra of palabrasOfensivas) {
        const palabraNormalizada = normalizarTexto(palabra);
        
        // Buscar como palabra completa
        const regex = new RegExp(`\\b${palabraNormalizada}\\b`, 'gi');
        if (regex.test(textoNormalizado)) {
            return true;
        }
        
        // Buscar en texto original (para detectar variaciones con símbolos)
        if (textoOriginal.includes(palabra)) {
            return true;
        }
    }

    // Verificar patrones regex
    for (const patron of patronesOfensivos) {
        if (patron.test(textoOriginal) || patron.test(textoNormalizado)) {
            return true;
        }
    }

    return false;
}

// Exportar para Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        contieneLenguajeOfensivo,
        normalizarTexto
    };
}

// Exportar para navegador
if (typeof window !== 'undefined') {
    window.filtroLenguaje = {
        contieneLenguajeOfensivo,
        normalizarTexto
    };
}