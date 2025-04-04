document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#ipForm");
    const resultsContainer = document.querySelector("#results");
    const contentContainer = document.querySelector("#content");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const ip = document.querySelector("#ip").value;
        const mask = document.querySelector("#mask").value;

        try {
            const response = await fetch("/calculate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ ip, mask })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Error en el cálculo");
            }

            const data = await response.json();
            displayResults(data);
        } catch (error) {
            alert(error.message);
        }
    });

    function displayResults(data) {
        document.querySelector("#ipcalc").textContent = data.ip;
        document.querySelector("#mascaracalc").textContent = `${data.mask} (/${data.maskBits})`;
        document.querySelector("#claseip").textContent = data.ipClass;
        document.querySelector("#tipoip").textContent = data.ipType;

        document.querySelector("#ipred").textContent = data.network;
        document.querySelector("#ipbroadcast").textContent = data.broadcast;
        document.querySelector("#nhost").textContent = data.hosts === -1 ? "N/A (red sin hosts)" : data.hosts;
        document.querySelector("#iputiles").textContent =
            data.firstHost === data.lastHost ? "N/A (red sin hosts)" : `${data.firstHost} - ${data.lastHost}`;

        document.querySelector("#ipbinaria").textContent = data.ipBinary;
        document.querySelector("#mascarabinaria").textContent = data.maskBinary;
        document.querySelector("#ipredbinaria").textContent = data.networkBinary;
        document.querySelector("#iphostbinaria").textContent = data.hostBinary;

        contentContainer.classList.add("active");
        resultsContainer.classList.remove("hidden");
    }
});
