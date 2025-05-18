const express = require('express');
const app = express();
const path = require('path');

// Configuración del servidor
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Función para validar IP y máscara
function isValidIP(ip) {
    const octets = ip.split('.').map(Number);
    return octets.length === 4 && octets.every(octet => octet >= 0 && octet <= 255);
}

function isValidMask(mask) {
    const maskNum = Number(mask);
    return !isNaN(maskNum) && maskNum >= 0 && maskNum <= 32;
}

// Función para convertir IP a binario
function ipToBinary(ip) {
    return ip.split('.').map(octet => {
        return parseInt(octet, 10).toString(2).padStart(8, '0');
    }).join('.');
}

// Función para calcular la información de la red
function calculateNetworkInfo(ip, maskBits) {
    const ipOctets = ip.split('.').map(Number);
    const maskBitsNum = parseInt(maskBits, 10);
    
    // Calcular máscara en formato decimal
    const mask = [];
    for (let i = 0; i < 4; i++) {
        const bits = Math.min(8, Math.max(0, maskBitsNum - i * 8));
        mask.push((bits === 8 ? 255 : (256 - Math.pow(2, 8 - bits))));
    }
    
    // Calcular dirección de red
    const network = ipOctets.map((octet, i) => octet & mask[i]);
    
    // Calcular dirección de broadcast
    const wildcard = mask.map(octet => 255 - octet);
    const broadcast = network.map((octet, i) => octet | wildcard[i]);
    
    // Calcular cantidad de hosts
    const hosts = Math.pow(2, 32 - maskBitsNum) - 2;
    
    // Determinar rango de IPs útiles
    const firstHost = [...network];
    firstHost[3] += 1;
    const lastHost = [...broadcast];
    lastHost[3] -= 1;
    
    // Determinar clase de IP
    let ipClass = '';
    if (ipOctets[0] <= 127) ipClass = 'A';
    else if (ipOctets[0] <= 191) ipClass = 'B';
    else if (ipOctets[0] <= 223) ipClass = 'C';
    else if (ipOctets[0] <= 239) ipClass = 'D (Multicast)';
    else ipClass = 'E (Experimental)';
    
    // Determinar si es pública o privada
    let ipType = 'Pública';
    if (
        (ipOctets[0] === 10) ||
        (ipOctets[0] === 172 && ipOctets[1] >= 16 && ipOctets[1] <= 31) ||
        (ipOctets[0] === 192 && ipOctets[1] === 168)
    ) {
        ipType = 'Privada';
    }
    
    // Calcular porciones de red y host en binario
    const networkBinary = network.map(octet => 
        octet.toString(2).padStart(8, '0')
    ).join('.');
    
    const hostBinary = ipOctets.map((octet, i) => 
        (octet & wildcard[i]).toString(2).padStart(8, '0')
    ).join('.');
    
    return {
        ip,
        mask: mask.join('.'),
        maskBits: maskBitsNum,
        network: network.join('.'),
        broadcast: broadcast.join('.'),
        hosts,
        firstHost: firstHost.join('.'),
        lastHost: lastHost.join('.'),
        ipClass,
        ipType,
        networkBinary,
        hostBinary,
        ipBinary: ipToBinary(ip),
        maskBinary: ipToBinary(mask.join('.'))
    };
}

// Endpoint para el cálculo
app.post('/calculate', (req, res) => {
    const { ip, mask } = req.body;
    
    if (!isValidIP(ip)) {
        return res.status(400).json({ error: 'Dirección IP inválida' });
    }
    
    if (!isValidMask(mask)) {
        return res.status(400).json({ error: 'Máscara inválida (debe ser 0-32)' });
    }
    
    const result = calculateNetworkInfo(ip, mask);
    res.json(result);
});

const PORT = 80;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en http://0.0.0.0:${PORT}`);
});
