const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


/* =========================
   STATUS
   ========================= */

let huidigeTaal = null;
let huidigHoofdstuk = null;

async function huidigeGebruikerId() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error || !user) {
        console.error(
            "Geen ingelogde gebruiker:",
            error
        );

        return null;
    }

    return user.id;
}

/* =========================
   ELEMENTEN
   ========================= */

const loginScreen = document.getElementById("loginScreen");
const homeScreen = document.getElementById("homeScreen");
const languageScreen = document.getElementById("languageScreen");
const chapterScreen = document.getElementById("chapterScreen");

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
   UITLOGGEN
   ========================= */

logoutButton.addEventListener("click", async function () {

    await supabaseClient.auth.signOut();

    toonScherm(loginScreen);

});

document
    .getElementById("loginButton")
    .addEventListener("click", async function () {

        const email =
            document
                .getElementById("loginEmail")
                .value
                .trim();

        const password =
            document
                .getElementById("loginPassword")
                .value;

        const errorElement =
            document.getElementById("loginError");

        errorElement.textContent = "";

        if (!email || !password) {

            errorElement.textContent =
                "Vul e-mail en wachtwoord in.";

            return;
        }

        const {
            error
        } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {

            console.error(
                "Login fout:",
                error
            );

            errorElement.textContent =
                "E-mail of wachtwoord is niet correct.";

            return;
        }

        await controleerSessie();

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

        console.error(
            "Fout bij laden hoofdstukken:",
            error
        );

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

        // Ingelogde gebruiker ophalen
        const gebruikerId =
            await huidigeGebruikerId();

        if (!gebruikerId) {

            alert(
                "Je bent niet ingelogd."
            );

            return;
        }

        const {
            data: bestaandeHoofdstukken,
            error: laadFout
        } = await supabaseClient
            .from("hoofdstukken")
            .select("volgorde")
            .eq("taal", huidigeTaal)
            .order("volgorde", {
                ascending: false
            })
            .limit(1);

        if (laadFout) {

            console.error(
                "Fout bij laden hoofdstukken:",
                laadFout
            );

            alert(
                "Fout bij bepalen van de volgorde."
            );

            return;
        }

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
                gebruiker_id: gebruikerId,
                taal: huidigeTaal,
                naam: naam,
                volgorde: volgorde
            });

        if (error) {

            console.error(
                "Fout bij opslaan hoofdstuk:",
                error
            );

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

        console.error(
            "Fout bij laden woorden:",
            error
        );

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

        // Ingelogde gebruiker ophalen
        const gebruikerId =
            await huidigeGebruikerId();

        if (!gebruikerId) {

            alert(
                "Je bent niet ingelogd."
            );

            return;
        }

        const {
            error
        } = await supabaseClient
            .from("woorden")
            .insert({

                gebruiker_id:
                    gebruikerId,

                hoofdstuk_id:
                    huidigHoofdstuk.id,

                nederlands:
                    nederlands,

                vertaling:
                    vertaling

            });

        if (error) {

            console.error(
                "Fout bij opslaan woord:",
                error
            );

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


        });

    });

async function selecteerOefenWoorden() {

    const select =
        document.getElementById(
            "practiceChapter"
        );

    const geselecteerdeIds =
        Array.from(
            select.selectedOptions
        ).map(option => option.value);


    // Geen selectie = alle hoofdstukken
    let hoofdstukIds =
        geselecteerdeIds;

    if (hoofdstukIds.length === 0) {

        const {
            data: hoofdstukken,
            error
        } = await supabaseClient
            .from("hoofdstukken")
            .select("id")
            .eq("taal", huidigeTaal)
            .order("volgorde", {
                ascending: true
            });

        if (error) {
            console.error(error);
            return [];
        }

        hoofdstukIds =
            hoofdstukken.map(
                hoofdstuk => hoofdstuk.id
            );
    }


    // Alle woorden ophalen
    const {
        data: woorden,
        error: woordenError
    } = await supabaseClient
        .from("woorden")
        .select("*")
        .in(
            "hoofdstuk_id",
            hoofdstukIds
        );

    if (woordenError) {

        console.error(
            "Fout bij ophalen woorden:",
            woordenError
        );

        return [];
    }


    if (!woorden || woorden.length === 0) {
        return [];
    }


    // Statistieken ophalen
    const woordIds =
        woorden.map(
            woord => woord.id
        );

    const {
        data: statistieken,
        error: statistiekenError
    } = await supabaseClient
        .from("woord_statistieken")
        .select("*")
        .in(
            "woord_id",
            woordIds
        );

    if (statistiekenError) {

        console.error(
            "Fout bij ophalen statistieken:",
            statistiekenError
        );

        return [];
    }


    // Statistieken makkelijk terugvindbaar maken
    const statistiekMap = {};

    (statistieken || []).forEach(stat => {

        statistiekMap[stat.woord_id] =
            stat;

    });


    const geselecteerdeWoorden = [];


    // Per hoofdstuk selecteren
    for (
        const hoofdstukId
        of hoofdstukIds
    ) {

        const woordenHoofdstuk =
            woorden.filter(
                woord =>
                    woord.hoofdstuk_id ===
                    hoofdstukId
            );


        if (
            woordenHoofdstuk.length === 0
        ) {
            continue;
        }


        const aantalTeOefenen =
            Math.max(
                1,
                Math.ceil(
                    woordenHoofdstuk.length *
                    gekozenPercentage /
                    100
                )
            );


// Gewicht berekenen
const gewogenWoorden =
    woordenHoofdstuk.map(woord => {

        const stat =
            statistiekMap[woord.id];

        // Nieuw woord
        if (!stat) {
            return {
                woord: woord,
                gewicht: 5
            };
        }

        const juist =
            stat.juiste_antwoorden || 0;

        const fout =
            stat.foute_antwoorden || 0;

        const totaal =
            juist + fout;

        // Nog nooit geoefend
        if (totaal === 0) {
            return {
                woord: woord,
                gewicht: 5
            };
        }

        // Foutpercentage
        const foutPercentage =
            fout / totaal;

        // Moeilijkheid:
        // 1 = gemakkelijk
        // 10 = zeer moeilijk
        const moeilijkheidsGewicht =
            1 +
            (foutPercentage * 9);

        // Hoe lang geleden geoefend?
        let dagenSindsOefening = 0;

        if (stat.laatste_oefening) {

            const laatsteOefening =
                new Date(
                    stat.laatste_oefening
                );

            const nu =
                new Date();

            const verschil =
                nu.getTime() -
                laatsteOefening.getTime();

            dagenSindsOefening =
                verschil /
                (1000 * 60 * 60 * 24);
        }

        // Na 14 dagen maximaal 2x zoveel gewicht
        const recencyGewicht =
            1 +
            Math.min(
                Math.max(
                    dagenSindsOefening,
                    0
                ) / 14,
                1
            );

        // Moeilijkheid × ouderdom
        const gewicht =
            moeilijkheidsGewicht *
            recencyGewicht;

        return {
            woord: woord,
            gewicht: gewicht
        };

    });
        // Gewogen willekeurige selectie
        const gekozen =
            gewogenSelectie(
                gewogenWoorden,
                aantalTeOefenen
            );


        geselecteerdeWoorden.push(
            ...gekozen
        );

    }


    return geselecteerdeWoorden;
}

function gewogenSelectie(
    items,
    aantal
) {

    const resultaat = [];
    const over =
        [...items];


    while (
        resultaat.length < aantal &&
        over.length > 0
    ) {

        const totaalGewicht =
            over.reduce(
                (som, item) =>
                    som + item.gewicht,
                0
            );


        let willekeurig =
            Math.random() *
            totaalGewicht;


        let gekozenIndex = 0;


        for (
            let i = 0;
            i < over.length;
            i++
        ) {

            willekeurig -=
                over[i].gewicht;


            if (
                willekeurig <= 0
            ) {

                gekozenIndex = i;
                break;

            }

        }


        const gekozen =
            over.splice(
                gekozenIndex,
                1
            )[0];


        resultaat.push(
            gekozen.woord
        );

    }


    return resultaat;
}

/* =========================
   OEFENING STARTEN
   ========================= */

let oefenWoorden = [];


document
    .getElementById("startPracticeButton")
    .addEventListener("click", async function () {

        oefenWoorden =
            await selecteerOefenWoorden();

        if (
            !oefenWoorden ||
            oefenWoorden.length === 0
        ) {

            alert(
                "Er zijn geen woorden om te oefenen."
            );

            return;
        }

        document
            .getElementById("practiceSetupScreen")
            .classList.add("hidden");

        document
            .getElementById("practiceScreen")
            .classList.remove("hidden");

        toonOefenWoorden();

    });


function toonOefenWoorden() {

    const lijst =
        document.getElementById(
            "practiceWordsList"
        );

    lijst.innerHTML = "";

    document
        .getElementById("practiceProgress")
        .textContent =
            `${oefenWoorden.length} woorden`;

    oefenWoorden.forEach(
        (woord, index) => {

            const item =
                document.createElement("div");

            item.className =
                "practice-word-item";

            item.innerHTML = `

                <div class="practice-word-number">
                    ${index + 1}.
                </div>

                <div class="practice-word-dutch">
                    ${escapeHtml(
                        woord.nederlands
                    )}
                </div>

                <input
                    type="text"
                    class="practice-word-answer"
                    data-word-id="${woord.id}"
                    autocomplete="off"
                    placeholder="Vertaling">

                <div
                    class="practice-word-feedback">
                </div>

            `;

            lijst.appendChild(item);

        }
    );

}

/* =========================
   ANTWOORDEN CONTROLEREN
   ========================= */

document
    .getElementById("checkAllAnswersButton")
    .addEventListener("click", async function () {

        const items =
            document.querySelectorAll(
                ".practice-word-item"
            );

        let aantalJuist = 0;

        const statistieken = [];

        for (const item of items) {

            const input =
                item.querySelector(
                    ".practice-word-answer"
                );

            const feedback =
                item.querySelector(
                    ".practice-word-feedback"
                );

            const woordId =
                input.dataset.wordId;

            const woord =
                oefenWoorden.find(
                    w => w.id === woordId
                );

            if (!woord) {
                continue;
            }

            const gegevenAntwoord =
                input.value.trim();

            const juistAntwoord =
                woord.vertaling.trim();

            const isJuist =
                gegevenAntwoord.toLowerCase() ===
                juistAntwoord.toLowerCase();


            if (isJuist) {

                aantalJuist++;

                feedback.textContent = "✓";

            } else {

                feedback.textContent =
                    `✗ ${escapeHtml(
                        woord.vertaling
                    )}`;

            }


            input.disabled = true;


            statistieken.push({
                woordId: woord.id,
                juist: isJuist
            });

        }


        // Alles in één keer verwerken
        await slaAlleWoordStatistiekenOp(
            statistieken
        );


        // Knop uitschakelen
        this.disabled = true;


// Resultatenscherm tonen
toonResultaat(
    aantalJuist,
    items.length,
    statistieken
);

        function toonResultaat(
    aantalJuist,
    totaal,
    statistieken
) {

    const percentage =
        Math.round(
            (aantalJuist / totaal) * 100
        );

    document
        .getElementById("practiceScreen")
        .classList.add("hidden");

    document
        .getElementById("practiceResultScreen")
        .classList.remove("hidden");


    document
        .getElementById("resultLanguageLabel")
        .textContent =
            huidigeTaal === "frans"
                ? "Frans"
                : "Engels";


    document
        .getElementById("resultScore")
        .textContent =
            `${aantalJuist} van ${totaal} juist`;


    document
        .getElementById("resultPercentage")
        .textContent =
            `${percentage}%`;


    let boodschap;

    if (percentage === 100) {

        boodschap =
            "Perfect! 🎉";

    } else if (percentage >= 80) {

        boodschap =
            "Heel goed! 👍";

    } else if (percentage >= 60) {

        boodschap =
            "Goed bezig!";

    } else {

        boodschap =
            "Nog even oefenen. 💪";

    }


    document
        .getElementById("resultMessage")
        .textContent =
            boodschap;


    const foutenContainer =
        document.getElementById(
            "resultMistakes"
        );

    foutenContainer.innerHTML = "";


    // Alleen foute woorden tonen
    const fouten =
        statistieken.filter(
            stat => !stat.juist
        );


    if (fouten.length === 0) {

        return;

    }


    const titel =
        document.createElement("h3");

    titel.textContent =
        "Deze woorden waren fout:";

    foutenContainer.appendChild(
        titel
    );


    fouten.forEach(stat => {

        const woord =
            oefenWoorden.find(
                w => w.id === stat.woordId
            );

        if (!woord) {
            return;
        }


        const item =
            document.createElement("div");

        item.className =
            "result-mistake";

        item.innerHTML = `

            <div class="result-mistake-word">
                ${escapeHtml(
                    woord.nederlands
                )}
            </div>

            <div class="result-mistake-answer">
                Juiste antwoord:
                ${escapeHtml(
                    woord.vertaling
                )}
            </div>

        `;

        foutenContainer.appendChild(
            item
        );

    });

}

    });
document
    .getElementById("retryPracticeButton")
    .addEventListener("click", async function () {

        oefenWoorden =
            await selecteerOefenWoorden();

        if (
            !oefenWoorden ||
            oefenWoorden.length === 0
        ) {

            alert(
                "Er zijn geen woorden om te oefenen."
            );

            return;
        }

        document
            .getElementById("practiceResultScreen")
            .classList.add("hidden");

        document
            .getElementById("practiceScreen")
            .classList.remove("hidden");

        document
            .getElementById("checkAllAnswersButton")
            .disabled = false;

        document
            .getElementById("practiceResult")
            .textContent = "";

        toonOefenWoorden();

    });

document
    .getElementById("resultBackButton")
    .addEventListener("click", function () {

        document
            .getElementById("practiceResultScreen")
            .classList.add("hidden");

        document
            .getElementById("practiceSetupScreen")
            .classList.remove("hidden");

    });

/* =========================
   STATISTIEK OPSLAAN
   ========================= */

async function slaAlleWoordStatistiekenOp(
    statistieken
) {

    if (
        !statistieken ||
        statistieken.length === 0
    ) {
        return;
    }

    const gebruikerId =
        await huidigeGebruikerId();

    if (!gebruikerId) {

        console.error(
            "Geen ingelogde gebruiker."
        );

        return;
    }


    const woordIds =
        statistieken.map(
            stat => stat.woordId
        );


    // Bestaande statistieken in één keer ophalen
    const {
        data: bestaandeStatistieken,
        error: selectError
    } = await supabaseClient
        .from("woord_statistieken")
        .select("*")
        .in(
            "woord_id",
            woordIds
        );


    if (selectError) {

        console.error(
            "Fout bij ophalen statistieken:",
            selectError
        );

        return;
    }


    const bestaandeMap = {};


    (bestaandeStatistieken || []).forEach(
        stat => {

            bestaandeMap[
                stat.woord_id
            ] = stat;

        }
    );


    const nieuweStatistieken = [];
    const updates = [];


    statistieken.forEach(stat => {

        const bestaande =
            bestaandeMap[
                stat.woordId
            ];


        if (!bestaande) {

nieuweStatistieken.push({

    gebruiker_id:
        gebruikerId,

    woord_id:
        stat.woordId,

    juiste_antwoorden:
        stat.juist ? 1 : 0,

    foute_antwoorden:
        stat.juist ? 0 : 1,

    laatste_oefening:
        new Date().toISOString()

});
        } else {

            updates.push({

                woordId:
                    stat.woordId,

                juiste:
                    bestaande.juiste_antwoorden +
                    (stat.juist ? 1 : 0),

                foute:
                    bestaande.foute_antwoorden +
                    (stat.juist ? 0 : 1)

            });

        }

    });


    // Nieuwe statistieken in één keer toevoegen
    if (
        nieuweStatistieken.length > 0
    ) {

        const {
            error
        } = await supabaseClient
            .from("woord_statistieken")
            .insert(
                nieuweStatistieken
            );


        if (error) {

            console.error(
                "Fout bij toevoegen statistieken:",
                error
            );

        }

    }


    // Bestaande statistieken bijwerken
    for (const update of updates) {

        const {
            error
        } = await supabaseClient
            .from("woord_statistieken")
            .update({

                juiste_antwoorden:
                    update.juiste,

                foute_antwoorden:
                    update.foute,

                laatste_oefening:
                    new Date().toISOString()

            })
            .eq(
                "woord_id",
                update.woordId
            );


        if (error) {

            console.error(
                "Fout bij bijwerken statistiek:",
                error
            );

        }

    }

}

/* =========================
   OEFENING STOPPEN
   ========================= */

document
    .getElementById("stopPracticeButton")
    .addEventListener("click", function () {

        document
            .getElementById("practiceScreen")
            .classList.add("hidden");

        document
            .getElementById("practiceSetupScreen")
            .classList.remove("hidden");

    });

document
    .getElementById("practiceBackButton")
    .addEventListener("click", function () {

        document
            .getElementById("practiceSetupScreen")
            .classList.add("hidden");

        document
            .getElementById("languageScreen")
            .classList.remove("hidden");

    });


document
    .getElementById("stopPracticeButton")
    .addEventListener("click", function () {

        document
            .getElementById("practiceScreen")
            .classList.add("hidden");

        document
            .getElementById("practiceSetupScreen")
            .classList.remove("hidden");

    });


document
    .getElementById("resultBackButton")
    .addEventListener("click", function () {

        document
            .getElementById("practiceResultScreen")
            .classList.add("hidden");

        document
            .getElementById("practiceSetupScreen")
            .classList.remove("hidden");

    });
