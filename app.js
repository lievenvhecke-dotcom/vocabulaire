const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


/* =========================
   STATUS
   ========================= */

let huidigeTaal = null;
let huidigHoofdstuk = null;


/* =========================
   ELEMENTEN
   ========================= */

const loginScreen = document.getElementById("loginScreen");
const homeScreen = document.getElementById("homeScreen");
const languageScreen = document.getElementById("languageScreen");
const chapterScreen = document.getElementById("chapterScreen");

const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

const logoutButton =
    document.getElementById("logoutButton");

const languageTitle =
    document.getElementById("languageTitle");

const languageSubtitle =
    document.getElementById("languageSubtitle");

const chaptersList =
    document.getElementById("chaptersList");

const chapterTitle =
    document.getElementById("chapterTitle");

const chapterSubtitle =
    document.getElementById("chapterSubtitle");

const wordsList =
    document.getElementById("wordsList");


/* =========================
   SCHERMEN
   ========================= */

function toonScherm(screen) {

    [
        loginScreen,
        homeScreen,
        languageScreen,
        chapterScreen
    ].forEach(element => {

        element.classList.add("hidden");

    });

    screen.classList.remove("hidden");
}


/* =========================
   LOGIN
   ========================= */

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    loginError.textContent = "";

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    const { error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

    if (error) {

        loginError.textContent =
            "Inloggen mislukt. Controleer je e-mailadres en wachtwoord.";

        return;
    }

    toonScherm(homeScreen);
});


/* =========================
   UITLOGGEN
   ========================= */

logoutButton.addEventListener("click", async function () {

    await supabaseClient.auth.signOut();

    toonScherm(loginScreen);

});


/* =========================
   SESSIE CONTROLEREN
   ========================= */

async function controleerSessie() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (session) {

        toonScherm(homeScreen);

    } else {

        toonScherm(loginScreen);

    }
}


/* =========================
   TAAL KIEZEN
   ========================= */

document
    .querySelectorAll(".language-card")
    .forEach(button => {

        button.addEventListener("click", async function () {

            huidigeTaal =
                this.dataset.language;

            if (huidigeTaal === "frans") {

                languageTitle.textContent =
                    "Frans";

                languageSubtitle.textContent =
                    "Franse woordenschat";

            } else {

                languageTitle.textContent =
                    "Engels";

                languageSubtitle.textContent =
                    "Engelse woordenschat";

            }

            toonScherm(languageScreen);

            await laadHoofdstukken();

        });

    });


/* =========================
   TERUG NAAR HOME
   ========================= */

document
    .getElementById("backHomeButton")
    .addEventListener("click", function () {

        toonScherm(homeScreen);

    });


/* =========================
   HOOFDSTUKKEN LADEN
   ========================= */

async function laadHoofdstukken() {

    chaptersList.innerHTML =
        "<p>Laden...</p>";

    const {
        data,
        error
    } = await supabaseClient
        .from("hoofdstukken")
        .select("*")
        .eq("taal", huidigeTaal)
        .order("volgorde", {
            ascending: true
        });

    if (error) {

        chaptersList.innerHTML =
            "<p>Er ging iets mis bij het laden.</p>";

        console.error(error);

        return;
    }

    chaptersList.innerHTML = "";

    if (!data || data.length === 0) {

        chaptersList.innerHTML =
            "<p>Nog geen hoofdstukken.</p>";

        return;
    }

    data.forEach(hoofdstuk => {

        const item =
            document.createElement("div");

        item.className =
            "chapter-item";

        item.innerHTML = `
            <span class="chapter-name">
                ${escapeHtml(hoofdstuk.naam)}
            </span>

            <span class="chapter-actions">

                <button
                    class="edit-chapter-button"
                    type="button">
                    ✏️
                </button>

                <button
                    class="delete-chapter-button"
                    type="button">
                    🗑️
                </button>

                <span class="chapter-arrow">
                    →
                </span>

            </span>
        `;

        // Hoofdstuk openen
        item.addEventListener("click", function () {

            openHoofdstuk(hoofdstuk);

        });

        // Bewerken
        item
            .querySelector(".edit-chapter-button")
            .addEventListener("click", function (event) {

                event.stopPropagation();

                bewerkHoofdstuk(hoofdstuk);

            });

        // Verwijderen
        item
            .querySelector(".delete-chapter-button")
            .addEventListener("click", function (event) {

                event.stopPropagation();

                verwijderHoofdstuk(hoofdstuk);

            });

        chaptersList.appendChild(item);

    });
}

async function bewerkHoofdstuk(hoofdstuk) {

    const nieuweNaam =
        prompt(
            "Nieuwe naam voor het hoofdstuk:",
            hoofdstuk.naam
        );

    if (nieuweNaam === null) {
        return;
    }

    const naam =
        nieuweNaam.trim();

    if (!naam) {
        alert("De naam mag niet leeg zijn.");
        return;
    }

    const {
        error
    } = await supabaseClient
        .from("hoofdstukken")
        .update({
            naam: naam
        })
        .eq("id", hoofdstuk.id);

    if (error) {

        console.error(
            "Fout bij wijzigen hoofdstuk:",
            error
        );

        alert(
            "Fout bij wijzigen:\n\n" +
            error.message
        );

        return;
    }

    await laadHoofdstukken();
}


async function verwijderHoofdstuk(hoofdstuk) {

    const bevestiging =
        confirm(
            'Ben je zeker dat je hoofdstuk "' +
            hoofdstuk.naam +
            '" wilt verwijderen?'
        );

    if (!bevestiging) {
        return;
    }

    const {
        error
    } = await supabaseClient
        .from("hoofdstukken")
        .delete()
        .eq("id", hoofdstuk.id);

    if (error) {

        console.error(
            "Fout bij verwijderen hoofdstuk:",
            error
        );

        alert(
            "Fout bij verwijderen:\n\n" +
            error.message
        );

        return;
    }

    await laadHoofdstukken();
}

/* =========================
   HOOFDSTUK OPENEN
   ========================= */

function openHoofdstuk(hoofdstuk) {

    huidigHoofdstuk =
        hoofdstuk;

    chapterTitle.textContent =
        hoofdstuk.naam;

    chapterSubtitle.textContent =
        huidigeTaal === "frans"
            ? "Franse woorden"
            : "Engelse woorden";

    toonScherm(chapterScreen);

    laadWoorden();
}


/* =========================
   TERUG NAAR TAAL
   ========================= */

document
    .getElementById("backLanguageButton")
    .addEventListener("click", function () {

        toonScherm(languageScreen);

    });


/* =========================
   HOOFDSTUK TOEVOEGEN
   ========================= */

const chapterModal =
    document.getElementById("chapterModal");

document
    .getElementById("addChapterButton")
    .addEventListener("click", function () {

        document
            .getElementById("chapterName")
            .value = "";

        chapterModal.classList.remove("hidden");

    });


document
    .getElementById("cancelChapterButton")
    .addEventListener("click", function () {

        chapterModal.classList.add("hidden");

    });


document
    .getElementById("saveChapterButton")
    .addEventListener("click", async function () {

        const naam =
            document
                .getElementById("chapterName")
                .value
                .trim();

        if (!naam) {

            return;

        }

        const {
            data: bestaandeHoofdstukken
        } = await supabaseClient
            .from("hoofdstukken")
            .select("volgorde")
            .eq("taal", huidigeTaal)
            .order("volgorde", {
                ascending: false
            })
            .limit(1);

        let volgorde = 1;

        if (
            bestaandeHoofdstukken &&
            bestaandeHoofdstukken.length > 0
        ) {

            volgorde =
                bestaandeHoofdstukken[0].volgorde + 1;

        }

        const {
            error
        } = await supabaseClient
            .from("hoofdstukken")
            .insert({
                taal: huidigeTaal,
                naam: naam,
                volgorde: volgorde
            });

if (error) {

    console.error("Fout bij opslaan hoofdstuk:", error);

    alert(
        "Fout bij opslaan:\n\n" +
        error.message
    );

    return;
}

        chapterModal.classList.add("hidden");

        await laadHoofdstukken();

    });


/* =========================
   WOORDEN LADEN
   ========================= */

async function laadWoorden() {

    wordsList.innerHTML =
        "<p>Laden...</p>";

    const {
        data,
        error
    } = await supabaseClient
        .from("woorden")
        .select("*")
        .eq(
            "hoofdstuk_id",
            huidigHoofdstuk.id
        )
        .order("created_at", {
            ascending: true
        });

    if (error) {

        wordsList.innerHTML =
            "<p>Er ging iets mis bij het laden.</p>";

        console.error(error);

        return;
    }

    wordsList.innerHTML = "";

    if (!data || data.length === 0) {

        wordsList.innerHTML =
            "<p>Nog geen woorden.</p>";

        return;
    }

    data.forEach(woord => {

        const item =
            document.createElement("div");

        item.className =
            "word-item";

        item.innerHTML = `
            <span class="word-dutch">
                ${escapeHtml(woord.nederlands)}
            </span>

            <span class="word-translation">
                ${escapeHtml(woord.vertaling)}
            </span>

            <span class="word-actions">

                <button
                    class="edit-word-button"
                    type="button">
                    ✏️
                </button>

                <button
                    class="delete-word-button"
                    type="button">
                    🗑️
                </button>

            </span>
        `;

        // Bewerken
        item
            .querySelector(".edit-word-button")
            .addEventListener("click", function () {

                bewerkWoord(woord);

            });

        // Verwijderen
        item
            .querySelector(".delete-word-button")
            .addEventListener("click", function () {

                verwijderWoord(woord);

            });

        wordsList.appendChild(item);

    });
}

async function bewerkWoord(woord) {

    const nieuwNederlands =
        prompt(
            "Nederlands:",
            woord.nederlands
        );

    if (nieuwNederlands === null) {
        return;
    }

    const nieuwVertaling =
        prompt(
            "Vertaling:",
            woord.vertaling
        );

    if (nieuwVertaling === null) {
        return;
    }

    const nederlands =
        nieuwNederlands.trim();

    const vertaling =
        nieuwVertaling.trim();

    if (!nederlands || !vertaling) {

        alert(
            "Beide velden moeten ingevuld zijn."
        );

        return;
    }

    const {
        error
    } = await supabaseClient
        .from("woorden")
        .update({
            nederlands: nederlands,
            vertaling: vertaling
        })
        .eq("id", woord.id);

    if (error) {

        console.error(
            "Fout bij wijzigen woord:",
            error
        );

        alert(
            "Fout bij wijzigen:\n\n" +
            error.message
        );

        return;
    }

    await laadWoorden();
}


async function verwijderWoord(woord) {

    const bevestiging =
        confirm(
            'Ben je zeker dat je "' +
            woord.nederlands +
            '" wilt verwijderen?'
        );

    if (!bevestiging) {
        return;
    }

    const {
        error
    } = await supabaseClient
        .from("woorden")
        .delete()
        .eq("id", woord.id);

    if (error) {

        console.error(
            "Fout bij verwijderen woord:",
            error
        );

        alert(
            "Fout bij verwijderen:\n\n" +
            error.message
        );

        return;
    }

    await laadWoorden();
}

/* =========================
   WOORD TOEVOEGEN
   ========================= */

const wordModal =
    document.getElementById("wordModal");


document
    .getElementById("addWordButton")
    .addEventListener("click", function () {

        document
            .getElementById("dutchWord")
            .value = "";

        document
            .getElementById("translatedWord")
            .value = "";

        wordModal.classList.remove("hidden");

    });


document
    .getElementById("cancelWordButton")
    .addEventListener("click", function () {

        wordModal.classList.add("hidden");

    });


document
    .getElementById("saveWordButton")
    .addEventListener("click", async function () {

        const nederlands =
            document
                .getElementById("dutchWord")
                .value
                .trim();

        const vertaling =
            document
                .getElementById("translatedWord")
                .value
                .trim();

        if (!nederlands || !vertaling) {

            return;

        }

        const {
            error
        } = await supabaseClient
            .from("woorden")
            .insert({

                hoofdstuk_id:
                    huidigHoofdstuk.id,

                nederlands:
                    nederlands,

                vertaling:
                    vertaling

        });

        if (error) {

            console.error(error);

            alert(
                "Het woord kon niet worden opgeslagen."
            );

            return;
        }

        wordModal.classList.add("hidden");

        await laadWoorden();

    });


/* =========================
   HTML VEILIG MAKEN
   ========================= */

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================
   START
   ========================= */

controleerSessie();

document
    .getElementById("practiceButton")
    .addEventListener("click", async function () {

        document
            .getElementById("languageScreen")
            .classList.add("hidden");

        document
            .getElementById("practiceSetupScreen")
            .classList.remove("hidden");

        document
            .getElementById("practiceLanguageLabel")
            .textContent =
                huidigeTaal === "frans"
                    ? "Frans"
                    : "Engels";

        await laadOefenHoofdstukken();
        await updateOefenAantal();

    });

async function laadOefenHoofdstukken() {

    const select =
        document.getElementById(
            "practiceChapter"
        );

    select.innerHTML = "";

    const {
        data,
        error
    } = await supabaseClient
        .from("hoofdstukken")
        .select("*")
        .eq("taal", huidigeTaal)
        .order("volgorde", {
            ascending: true
        });

    if (error) {

        console.error(
            "Fout bij laden oefenhoofdstukken:",
            error
        );

        return;
    }

    data.forEach(hoofdstuk => {

        const option =
            document.createElement("option");

        option.value =
            hoofdstuk.id;

        option.textContent =
            hoofdstuk.naam;

        select.appendChild(option);

    });
}

let gekozenPercentage = 75;

document
    .querySelectorAll(".percentage-button")
    .forEach(button => {

        button.addEventListener("click", function () {

            document
                .querySelectorAll(".percentage-button")
                .forEach(b => {
                    b.classList.remove("selected");
                });

            this.classList.add("selected");

            gekozenPercentage =
                Number(
                    this.dataset.percentage
                );

            updateOefenAantal();

        });

    });

async function updateOefenAantal() {

    const select =
        document.getElementById(
            "practiceChapter"
        );

    const geselecteerdeIds =
        Array.from(
            select.selectedOptions
        ).map(option => option.value);

    let query =
        supabaseClient
            .from("woorden")
            .select("id", {
                count: "exact",
                head: true
            });

    // Geen selectie = alle hoofdstukken
    if (geselecteerdeIds.length > 0) {

        query =
            query.in(
                "hoofdstuk_id",
                geselecteerdeIds
            );

    } else {

        const {
            data: hoofdstukken,
            error
        } = await supabaseClient
            .from("hoofdstukken")
            .select("id")
            .eq("taal", huidigeTaal);

        if (error) {

            console.error(error);

            return;
        }

        const ids =
            hoofdstukken.map(
                hoofdstuk => hoofdstuk.id
            );

        if (ids.length === 0) {

            document
                .getElementById(
                    "practiceWordCount"
                )
                .textContent =
                    "Nog geen hoofdstukken.";

            return;
        }

        query =
            query.in(
                "hoofdstuk_id",
                ids
            );
    }

    const {
        count,
        error
    } = await query;

    if (error) {

        console.error(
            "Fout bij tellen woorden:",
            error
        );

        return;
    }

    if (!count) {

        document
            .getElementById(
                "practiceWordCount"
            )
            .textContent =
                "Geen woorden beschikbaar.";

        return;
    }

    const aantal =
        Math.max(
            1,
            Math.ceil(
                count *
                gekozenPercentage /
                100
            )
        );

    document
        .getElementById(
            "practiceWordCount"
        )
        .textContent =
            `${count} woorden beschikbaar → ` +
            `${aantal} woorden worden geoefend.`;
}
);
