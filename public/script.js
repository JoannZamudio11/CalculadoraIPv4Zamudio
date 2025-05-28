document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#ipForm");
    const resultsContainer = document.querySelector("#results");
    const contentContainer = document.querySelector("#content");
    const maskBitsGroup = document.querySelector("#mask-bits-group");
    const maskDecimalGroup = document.querySelector("#mask-decimal-group");
    const maskTypeRadios = document.querySelectorAll("input[name='mask-type']");
    const maskBitsInput = document.querySelector("#mask");
    const maskDecimalInput = document.querySelector("#mask-decimal");

    // Manejar cambio entre tipos de máscara
    maskTypeRadios.forEach(radio => {
        radio.addEventListener("change", () => {
            if (radio.value === "bits") {
                maskBitsGroup.classList.remove("hidden");
                maskDecimalGroup.classList.add("hidden");
                maskBitsInput.required = true;
                maskDecimalInput.required = false;
            } else {
                maskBitsGroup.classList.add("hidden");
                maskDecimalGroup.classList.remove("hidden");
                maskBitsInput.required = false;
                maskDecimalInput.required = true;
            }
        });
    });

    // Validar máscara decimal mientras se escribe
    maskDecimalInput.addEventListener("input", (e) => {
        const value = e.target.value;
        if (value.length > 0 && !/^(\d{1,3}\.){0,3}\d{0,3}$/.test(value)) {
            e.target.value = value.slice(0, -1);
        }
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const ip = document.querySelector("#ip").value;
        const maskType = document.querySelector("input[name='mask-type']:checked").value;
        let maskValue = maskType === "bits" 
            ? document.querySelector("#mask").value 
            : document.querySelector("#mask-decimal").value;

        // Reiniciar animaciones
        const container = document.querySelector('.container');
        const results = document.getElementById('results');

        container.classList.remove('animate');
        results.classList.remove('animate');

        void container.offsetWidth;
        void results.offsetWidth;

        container.classList.add('animate');
        results.classList.add('animate');

        // Validaciones
        if (!isValidIP(ip)) {
            alert("Dirección IP inválida. Debe tener 4 octetos (0-255) separados por puntos.");
            return;
        }

        let maskBits;
        if (maskType === "bits") {
            if (!isValidMaskBits(maskValue)) {
                alert("Máscara inválida. Debe ser un número entre 0 y 32.");
                return;
            }
            maskBits = maskValue;
        } else {
            if (!isValidMaskDecimal(maskValue)) {
                alert("Máscara decimal inválida. Debe ser una secuencia válida de 4 octetos (ej: 255.255.255.0) donde los 1's preceden a los 0's.");
                return;
            }
            maskBits = maskDecimalToBits(maskValue);
        }

        try {
            const response = await fetch("/calculate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    ip, 
                    mask: maskBits,
                    maskType // Opcional: enviar el tipo de máscara al servidor
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Error en el cálculo");
            }

            const data = await response.json();
            
            // Añadir la máscara decimal a los resultados si fue calculada desde bits
            if (maskType === "bits") {
                data.maskDecimal = maskBitsToDecimal(maskBits);
            } else {
                data.maskDecimal = maskValue;
            }
            
            displayResults(data);
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });

    // Funciones auxiliares para la validación y conversión
    function isValidIP(ip) {
        const octets = ip.split('.').map(Number);
        return octets.length === 4 && 
               octets.every(octet => !isNaN(octet)) && 
               octets.every(octet => octet >= 0 && octet <= 255);
    }

    function isValidMaskBits(mask) {
        const maskNum = Number(mask);
        return !isNaN(maskNum) && maskNum >= 0 && maskNum <= 32;
    }

    function isValidMaskDecimal(mask) {
        const octets = mask.split('.').map(Number);
        if (octets.length !== 4 || 
            octets.some(octet => isNaN(octet))) {
            return false;
        }
        
        // Validar que cada octeto esté entre 0-255
        if (octets.some(octet => octet < 0 || octet > 255)) {
            return false;
        }
        
        // Convertir a binario y validar la secuencia (1's seguidos de 0's)
        const binaryStr = octets.map(octet => 
            octet.toString(2).padStart(8, '0')
        ).join('');
        
        const firstZero = binaryStr.indexOf('0');
        if (firstZero === -1) return true; // todos son 1's
        
        // Verificar que no haya 1's después del primer 0
        return binaryStr.slice(firstZero).indexOf('1') === -1;
    }

    function maskDecimalToBits(mask) {
        const octets = mask.split('.').map(Number);
        const binaryStr = octets.map(octet => 
            octet.toString(2).padStart(8, '0')
        ).join('');
        
        return (binaryStr.match(/1/g) || []).length;
    }

    function maskBitsToDecimal(bits) {
        bits = parseInt(bits, 10);
        const mask = [];
        for (let i = 0; i < 4; i++) {
            const bitsInOctet = Math.min(8, Math.max(0, bits - i * 8));
            mask.push(bitsInOctet === 8 ? 255 : (256 - Math.pow(2, 8 - bitsInOctet)));
        }
        return mask.join('.');
    }

    function displayResults(data) {
        document.querySelector("#ipcalc").textContent = data.ip;
        document.querySelector("#mascaracalc").textContent = `${data.maskDecimal} (/${data.maskBits})`;
        document.querySelector("#claseip").textContent = data.ipClass;
        document.querySelector("#tipoip").textContent = data.ipType;

        document.querySelector("#ipred").textContent = data.network;
        document.querySelector("#ipbroadcast").textContent = data.broadcast;
        document.querySelector("#nhost").textContent = data.hosts === -1 ? "N/A (red sin hosts)" : data.hosts;
        document.querySelector("#iputiles").textContent =
            data.firstHost === data.lastHost ? "N/A (red sin hosts)" : `${data.firstHost} - ${data.lastHost}`;

        // Resaltar porción de red y host en binario IP
        const splitBinary = (binaryStr, maskBits) => {
            const clean = binaryStr.replace(/\./g, "");
            const net = clean.slice(0, maskBits);
            const host = clean.slice(maskBits);
            const formatted = `${net}${host}`.padEnd(32, '0').match(/.{1,8}/g); // Formatear en bloques de 8 bits
            const html = formatted.map((byte, i) => {
                const startBit = i * 8;
                const endBit = startBit + 8;
                const isNet = maskBits > startBit;
                const part = [...byte].map((bit, j) => {
                    const globalBit = startBit + j;
                    return `<span class="${globalBit < maskBits ? 'net' : 'host'}">${bit}</span>`;
                }).join('');
                return part;
            }).join('.');

            return html;
        };

        document.querySelector("#ipbinaria").innerHTML = splitBinary(data.ipBinary, data.maskBits);
        document.querySelector("#mascarabinaria").innerHTML = splitBinary(data.maskBinary, data.maskBits);

        contentContainer.classList.add("active");
        resultsContainer.classList.remove("hidden");
    }

    document.querySelector("input[name='mask-type']:checked").dispatchEvent(new Event('change'));
});