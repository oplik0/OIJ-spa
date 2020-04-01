#!/usr/bin/env node
const readline = require("readline"); // moduł Node.js potrzebny do działania przez linię poleceń
Number.prototype.map = function(in_min, in_max, out_min, out_max) {
    return Math.round(
        ((this - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
    );
}; // przypisanie do prototypu zmiennych typu Number funkcji mapującej liczbę z jednego zakresu do drugiego
function closestPowerOf2(n) {
    if (n >= 2 ** 32) {
        return 63 - clz64(BigInt(n)); // Jeśli liczba ma więcej niż 32 bity, Math.clz32 nie wystarczy i trzeba sięgnąć po metodę dla BigIntów
        // (Najpewniej wolniejszą, bo chyba Math.clz32 jest zaimplementowane w wasm)
    }
    return 31 - Math.clz32(n);
}
function clz64(x) {
    // źródło: https://codegolf.stackexchange.com/a/177272
    return x < 0 ? 0 : x ? clz64(x / 2n) - 1 : 64;
}
function spacer(A, B) {
    const pow2A = closestPowerOf2(A),
        pow2B = closestPowerOf2(B);
    let result = Math.abs(pow2A - pow2B); // odległość w pionie, niezależna od odległości w poziomie
    // najmniejszą wartość mniejszego z "poziomów" drzewa (2^poziomu), wykorzystywany do obliczeń pozycji poziomej (do dalszego dzielenia "drzewa")
    let horizontal = pow2A < pow2B ? 2 ** pow2A : 2 ** pow2B;
    A = A.map(2 ** pow2A, 2 ** (pow2A + 1), 0, horizontal); //przemapowanie liczby z zakresu 2^pow2A - 2^(pow2A+1) na zakres 0 - horizontal
    B = B.map(2 ** pow2B, 2 ** (pow2B + 1), 0, horizontal); //przemapowanie liczby z zakresu 2^pow2B - 2^(pow2B+1) na zakres 0 - horizontal
    if (A === B && pow2A != pow2B) return result; //Jeśli przemapowane lizby są sobie równe i nie są na tym samym poziomie, mamy wynik
    result += pow2A < pow2B ? pow2A * 2 : pow2B * 2; // Dodajemy dwukrotność mniejszego z poziomów
    if (A === B && pow2A === pow2B) return result; // jeśli liczby są sobie równe i są na tym samym poziomie, to są po jego przeciwnich stronach więc możemy już zwrócić wartość
    horizontal /= 2; // Dzielimy horizontal na dwa by wyznaczał pionową połowę "drzewa"
    // Dopóki obie liczby są po tej samej stronie podziału, zmniejszamy wynik, bo oznacza to mniejszy dystans między nimi
    while (
        Math.sign((A - horizontal + 1) * 2 - 1) ===
            Math.sign((B - horizontal + 1) * 2 - 1) &&
        horizontal >= 2
    ) {
        if (
            Math.sign(A - horizontal) === 1 ||
            Math.sign(B - horizontal) === 1
        ) {
            // Jeśli obie liczby są większe niż podział, to zmniejszamy je o podział by cały czas pracować "pod" nim
            A -= horizontal;
            B -= horizontal;
        }
        horizontal /= 2; // Dzielimy naszą pionową linię na dwa, przesuwając go w "lewo"
        result -= 2; // Odejmujemy dwa, bo każdy podział oznacza że liczba jest o dwie krawędzie bliżej
    }
    return result;
}

module.exports = {
    spa: spacer
}; // eksport funkcji pozwala łatwo zaimportować ją z innego pliku i tam z niej korzystać

// Kod odpowiedzialny za CLI
if (!!process && !!process.argv && process.argv > 2) {
    // Jeśli zostały podane jakieś argumenty, wykonaj polecenia według nich
    const [, , ...args] = process.argv;
    for (let i = 1; i < args[0] * 2; i += 2) {
        console.log(spacer(args[i], args[i + 1]));
    }
} else {
    // Jeśli nie zostały podane argumenty, czekaj na ich podanie na stdin
    const rl = readline.createInterface({
        input: process.stdin
    });
    const getLine = (function() {
        const getLineGen = (async function*() {
            for await (const line of rl) {
                yield line;
            }
        })();
        return async () => (await getLineGen.next()).value;
    })();
    (async () => {
        const n = await getLine();
        let answers = [];
        for (let i = 0; i < parseInt(n); i++) {
            const AB = await getLine();
            const [A, B] = AB.split(" ").map(e => parseInt(e));
            answers.push(spacer(A, B));
        }

        rl.close();
        answers.forEach(answer => console.log(answer));
    })();
}
