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

            <span class="chapter-arrow">
                →
            </span>
        `;

        item.addEventListener("click", function () {

            openHoofdstuk(hoofdstuk);

        });

        chaptersList.appendChild(item);

    });
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

            console.error(error);

            alert(
                "Het hoofdstuk kon niet worden opgeslagen."
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
        `;

        wordsList.appendChild(item);

    });
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
