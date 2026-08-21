
/**
 * AlgoQuest - Core Game Logic & Interpreter
 */

// Web Audio API Synthesizer
class SoundSynth {
    constructor() {
        this.ctx = null;
        this.enabled = false;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    toggle() {
        this.init();
        this.enabled = !this.enabled;
        // Resume context if suspended (browser security)
        if (this.enabled && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.enabled;
    }

    play(freq, type, duration, slideTo = null) {
        if (!this.enabled) return;
        this.init();

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            if (slideTo) {
                osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
            }

            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            // Smooth fade out to prevent clicks
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.warn("Audio error:", e);
        }
    }

    playClick() {
        this.play(600, 'sine', 0.05);
    }

    playMove() {
        this.play(300, 'triangle', 0.1, 450);
    }

    playSuccess() {
        this.play(261.63, 'sine', 0.15); // C4
        setTimeout(() => this.play(329.63, 'sine', 0.15), 100); // E4
        setTimeout(() => this.play(392.00, 'sine', 0.15), 200); // G4
        setTimeout(() => this.play(523.25, 'sine', 0.3), 300); // C5
    }

    playFailure() {
        // Use two notes for a descending 'fail' sound
        this.play(220, 'sawtooth', 0.2);
        setTimeout(() => this.play(150, 'sawtooth', 0.3), 150);
    }

    playCorrect() {
        this.play(523.25, 'sine', 0.1); // C5
        setTimeout(() => this.play(659.25, 'sine', 0.2), 80); // E5
    }

    playWrong() {
        this.play(180, 'sawtooth', 0.3);
    }
}

const synth = new SoundSynth();

// Level Definitions
const LEVELS = {
    1: {
        id: 1,
        title: "Misi 1: Langkah Pertama",
        concept: "Konsep: Sekuensial (Urutan)",
        instruction: "Susun langkah-langkah lurus dan belok untuk mengarahkan Albi ke Portal tujuan. Ingat, robot bergerak sesuai urutan kode dari atas ke bawah!",
        gridSize: 6,
        start: { x: 1, y: 4, dir: 'UP' }, // 0-indexed, bottom-left is (0,5) in a 6x6 grid
        goal: { x: 1, y: 1 },
        walls: [
            { x: 0, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 },
            { x: 0, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 },
            { x: 0, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
            { x: 0, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
            { x: 0, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
            { x: 0, y: 5 }, { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }
        ],
        // The path is (1,4) -> (1,3) -> (1,2) -> (1,1) straight line
        allowedBlocks: ['move', 'turn-left', 'turn-right'],
        maxBlocks: 5,
        debuggingSetup: null,
        insight: "Algoritma Sekuensial adalah rangkaian instruksi yang dieksekusi satu per satu dari atas ke bawah secara berurutan. Komputer tidak akan melompati langkah apa pun!"
    },
    2: {
        id: 2,
        title: "Misi 2: Koridor Berulang",
        concept: "Konsep: Perulangan (Loops)",
        instruction: "Gunakan blok 'Ulangi' untuk membuat pola tangga (Maju, Kanan, Maju, Kiri) sebanyak 3 kali agar robot mencapai portal dengan jumlah blok minimal!",
        gridSize: 6,
        start: { x: 0, y: 5, dir: 'UP' },
        goal: { x: 3, y: 2 },
        // Simple corridor path (staircase from bottom-left to top-middle)
        walls: [
            // Row 0
            { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }, { x: 0, y: 0 },
            // Row 1
            { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 },
            // Row 2
            { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
            // Row 3
            { x: 0, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
            // Row 4
            { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
            // Row 5
            { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }
        ],
        // Path matches: (0,5)->(0,4)->(1,4)->(1,3)->(2,3)->(2,2)->(3,2)
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop'],
        maxBlocks: 5, // Requires using the loop block
        debuggingSetup: null,
        insight: "Perulangan (Loop) mempermudah kita menjalankan perintah yang sama berkali-kali tanpa menulisnya berulang-ulang. Ini membuat kode kita lebih rapi dan hemat memori!"
    },
    3: {
        id: 3,
        title: "Misi 3: Sensor Warna",
        concept: "Konsep: Kondisional (Percabangan)",
        instruction: "Gunakan sensor warna! Letakkan blok gerakan dan blok 'Jika Ubin Kuning/Ungu' di dalam perulangan 8 Kali agar robot otomatis berbelok saat menginjak ubin sensor.",
        gridSize: 6,
        start: { x: 0, y: 5, dir: 'UP' },
        goal: { x: 3, y: 0 },
        // Colored sensor tiles
        yellowTiles: [{ x: 0, y: 2 }], // Yellow turns RIGHT
        purpleTiles: [{ x: 3, y: 2 }], // Purple turns LEFT
        // Path: (0,5)->(0,4)->(0,3)->(0,2)[Yellow]->(1,2)->(2,2)->(3,2)[Purple]->(3,1)->(3,0)[Goal]
        walls: [
            { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 },
            { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
            { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
            { x: 4, y: 2 }, { x: 5, y: 2 },
            { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 },
            { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }
        ],
        allowedBlocks: ['move', 'loop', 'if-yellow', 'if-purple'],
        maxBlocks: 4,
        debuggingSetup: null,
        insight: "Kondisional (If-Else) memungkinkan program mengambil keputusan cerdas. Komputer akan mengecek apakah suatu kondisi terpenuhi (Benar/True) sebelum menjalankan perintah khusus."
    },
    4: {
        id: 4,
        title: "Misi 4: Membetulkan Kode",
        concept: "Konsep: Debugging (Menemukan Bug)",
        instruction: "Seseorang menulis program yang rusak! Albi menabrak dinding jika dijalankan. Cari kesalahan bloknya, hapus/atur ulang, dan buatlah program yang benar.",
        gridSize: 6,
        start: { x: 1, y: 4, dir: 'UP' },
        goal: { x: 4, y: 1 },
        // Path: (1,4)->(1,3)->(1,2)->[Turn Right]->(2,2)->(3,2)->(4,2)->[Turn Left]->(4,1)
        walls: [
            { x: 0, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 }, { x: 1, y: 5 },
            { x: 0, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
            { x: 0, y: 3 }, { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
            { x: 0, y: 2 }, { x: 5, y: 2 },
            { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 5, y: 1 },
            { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right'],
        maxBlocks: 8,
        // Buggy program preset
        debuggingSetup: [
            { type: 'move' },
            { type: 'turn-left' }, // BUG! Should be: move, then turn-right later
            { type: 'move' },
            { type: 'move' },
            { type: 'turn-right' },
            { type: 'move' },
            { type: 'move' }
        ],
        insight: "Debugging adalah keahlian penting programmer untuk menganalisis dan memperbaiki kesalahan (bug) secara mandiri. Jangan menyerah jika gagal; pelajari titik kegagalannya!"
    },
    5: {
        id: 5,
        title: "Misi 5: Tangga Panjang",
        concept: "Konsep: Perulangan Lanjutan",
        instruction: "Robot harus menaiki tangga panjang melewati 5 anak tangga! Gunakan blok 'Ulangi 5 Kali' dan susun pola gerak dalam loop: Maju, Kanan, Maju, Kiri.",
        gridSize: 6,
        start: { x: 0, y: 5, dir: 'UP' },
        goal: { x: 5, y: 0 },
        // Path staircase: (0,5)->(0,4)->(1,4)->(1,3)->(2,3)->(2,2)->(3,2)->(3,1)->(4,1)->(4,0)->(5,0)
        walls: [
            { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 },
            { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
            { x: 0, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
            { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
            { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 5, y: 1 },
            { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop'],
        maxBlocks: 6,
        debuggingSetup: null,
        insight: "Perulangan bersarang dan pola berulang memungkinkan kita menulis kode yang sangat efisien! Dengan 1 blok loop dan 4 perintah di dalamnya, kita bisa membuat 10 langkah sekaligus."
    },
    6: {
        id: 6,
        title: "Misi 6: Sensor Ganda",
        concept: "Konsep: Kondisional Majemuk",
        instruction: "Terdapat 2 sensor warna di lintasan! Gunakan blok 'Ulangi 7 Kali' dengan pola: Maju, Jika Ubin Kuning, Jika Ubin Ungu. Sensor akan otomatis membelokkan robot!",
        gridSize: 6,
        start: { x: 0, y: 5, dir: 'UP' },
        goal: { x: 2, y: 0 },
        // Path: (0,5)->(0,4)->(0,3)[Yellow->RIGHT]->(1,3)->(2,3)[Purple->UP]->(2,2)->(2,1)->(2,0)[GOAL]
        // Solution: Loop 7x { Move, if-yellow, if-purple }
        yellowTiles: [{ x: 0, y: 3 }],
        purpleTiles: [{ x: 2, y: 3 }],
        walls: [
            { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 },
            { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
            { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
            { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
            { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 },
            { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }
        ],
        allowedBlocks: ['move', 'loop', 'if-yellow', 'if-purple'],
        maxBlocks: 5,
        debuggingSetup: null,
        insight: "Kondisional majemuk memungkinkan program mengambil banyak keputusan cerdas sekaligus! Robot bisa bereaksi berbeda terhadap berbagai jenis kondisi yang ia temui."
    },
    7: {
        id: 7,
        title: "Misi 7: Kode Hybrid",
        concept: "Konsep: Sekuensial + Perulangan",
        instruction: "Gabungkan sekuensial dan perulangan! Susun 2 blok 'Maju' lalu 'Belok Kanan', kemudian gunakan blok 'Ulangi 3 Kali' berisi 'Maju', lalu letakkan 'Belok Kiri' dan 2 'Maju' lagi di luar perulangan.",
        gridSize: 6,
        start: { x: 2, y: 5, dir: 'UP' },
        goal: { x: 5, y: 1 },
        // Path: (2,5)->(2,4)->(2,3)->[TurnRight]->(3,3)->(4,3)->(5,3)->[TurnLeft]->(5,2)->(5,1)
        // Solution: Move, Move, TurnR, Loop(3x){Move}, TurnL, Move, Move = 8 blocks total
        walls: [
            { x: 0, y: 5 }, { x: 1, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 },
            { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
            { x: 0, y: 3 }, { x: 1, y: 3 },
            { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 },
            { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 },
            { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop'],
        maxBlocks: 8,
        debuggingSetup: null,
        insight: "Pemrograman nyata sering menggabungkan berbagai teknik! Sekuensial untuk bagian yang unik, dan perulangan untuk pola yang berulang. Inilah yang disebut 'kode hybrid'."
    },
    8: {
        id: 8,
        title: "Misi 8: Labirin Sempit",
        concept: "Konsep: Navigasi Presisi",
        instruction: "Labirin berliku! Susun instruksi berbelok dan maju yang presisi. Jalur: Maju 2x, Kanan, Maju 2x, Kiri, Maju 2x, Kanan, Maju 2x. Jangan sampai menabrak dinding!",
        gridSize: 6,
        start: { x: 0, y: 5, dir: 'UP' },
        goal: { x: 4, y: 1 },
        // Path: (0,5)->(0,4)->(0,3)->[R]->(1,3)->(2,3)->[L]->(2,2)->(2,1)->[R]->(3,1)->(4,1)[GOAL]
        // Solution: Move,Move,TurnR,Move,Move,TurnL,Move,Move,TurnR,Move,Move = 11 blocks
        walls: [
            { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 },
            { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
            { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
            { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
            { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 5, y: 1 },
            { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right'],
        maxBlocks: 11,
        debuggingSetup: null,
        insight: "Navigasi presisi adalah keterampilan penting dalam pemrograman robot nyata! Setiap instruksi harus diperiksa dengan cermat agar robot tidak melenceng dari jalurnya."
    },
    9: {
        id: 9,
        title: "Misi 9: Loop yang Rusak",
        concept: "Konsep: Debugging Perulangan",
        instruction: "Ada loop yang rusak! Program berisi loop yang salah konfigurasi. Periksa dan perbaiki: ubah jumlah pengulangan dan ganti urutan blok di dalamnya agar Albi mencapai portal.",
        gridSize: 6,
        start: { x: 0, y: 5, dir: 'UP' },
        goal: { x: 4, y: 1 },
        // Correct path: Loop 4x { Maju, Kanan, Maju, Kiri } gives staircase to (4,1)
        walls: [
            { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 },
            { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
            { x: 0, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
            { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
            { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 5, y: 1 },
            { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 }
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop'],
        maxBlocks: 6,
        debuggingSetup: [
            { type: 'loop', loopCount: 5, children: [
                { type: 'move' },
                { type: 'turn-left' },
                { type: 'move' },
                { type: 'turn-right' }
            ]}
        ],
        insight: "Bug di dalam perulangan sangat umum! Memilih jumlah iterasi yang salah atau urutan perintah yang terbalik adalah kesalahan klasik yang harus dideteksi dengan teliti."
    },
    10: {
        id: 10,
        title: "Misi 10: Tantangan Master",
        concept: "Konsep: Logika Algoritma Master",
        instruction: "Tantangan terakhir sebelum kuis! Rute panjang dengan sensor warna dan lorong berliku. Gunakan semua kemampuanmu: Loop + Kondisional + Sekuensial untuk menyelesaikannya!",
        gridSize: 6,
        start: { x: 0, y: 5, dir: 'UP' },
        goal: { x: 5, y: 0 },
        // Path with sensors: (0,5)->(0,4)->(0,3)[Yellow->Right]->(1,3)[Purple->Left]->(1,2)->(1,1)[Yellow->Right]->(2,1)->(3,1)[Purple->Left]->(3,0)[Yellow->Right]->(4,0)->(5,0)
        yellowTiles: [{ x: 0, y: 3 }, { x: 1, y: 1 }, { x: 3, y: 0 }],
        purpleTiles: [{ x: 1, y: 3 }, { x: 3, y: 1 }],
        walls: [
            { x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }, { x: 4, y: 5 }, { x: 5, y: 5 },
            { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
            { x: 2, y: 3 }, { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 },
            { x: 0, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, { x: 5, y: 2 },
            { x: 0, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 },
            { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }
        ],
        allowedBlocks: ['move', 'turn-left', 'turn-right', 'loop', 'if-yellow', 'if-purple'],
        maxBlocks: 8,
        debuggingSetup: null,
        insight: "Seorang master programmer sejati mampu menggabungkan semua teknik algoritma: urutan, pengulangan, kondisional, dan debugging. Selamat, kamu telah menguasai dasar-dasar algoritmika!"
    }
};

// Quiz Questions
const QUIZ_QUESTIONS = [
    {
        question: "Apa definisi paling tepat dari istilah 'Algoritma'?",
        options: [
            "Langkah-langkah logis dan terstruktur untuk menyelesaikan suatu masalah.",
            "Alat keras komputer untuk memproses gambar dan audio secara fisik.",
            "Aplikasi pengeditan foto yang biasa diunduh di handphone.",
            "Layar komputer berteknologi canggih anti-radiasi."
        ],
        correct: 0
    },
    {
        question: "Jika kita ingin mengulangi perintah 'Maju' sebanyak 5 kali, manakah cara yang paling hemat dan efisien?",
        options: [
            "Menumpuk 5 blok 'Maju 1 Langkah' secara manual berturut-turut.",
            "Menulis kode program baru dari awal di komputer terpisah.",
            "Menggunakan 1 blok Perulangan (Loop) diatur ke angka 5 untuk membungkus blok 'Maju'.",
            "Mengarahkan robot berjalan mundur sejauh 5 langkah."
        ],
        correct: 2
    },
    {
        question: "Di kehidupan nyata, manakah aktivitas berikut yang mencontohkan konsep 'Kondisional (Percabangan/If-Else)'?",
        options: [
            "Membaca buku komik dari bab pertama sampai halaman terakhir selesai.",
            "Memakai payung JIKA di luar sedang turun hujan, JIKA TIDAK maka tidak memakai.",
            "Menyetel alarm handphone untuk berbunyi tepat pukul 06.00 setiap pagi.",
            "Berlari mengelilingi lapangan sekolah sebanyak tepat 3 kali putaran."
        ],
        correct: 1
    },
    {
        question: "Apa yang dilakukan seorang programmer saat melakukan proses 'Debugging'?",
        options: [
            "Menghapus seluruh file sistem operasi komputer agar bersih.",
            "Membeli komponen robot baru yang lebih mahal dan cepat.",
            "Mengunduh game online terbaru untuk melepas penat kerja.",
            "Menganalisis, menemukan, dan membetulkan baris kode yang salah agar program berjalan lancar."
        ],
        correct: 3
    },
    {
        question: "Mengapa komputer membutuhkan instruksi yang berurutan (Sequencing) secara jelas?",
        options: [
            "Karena komputer membaca dan mengeksekusi instruksi satu per satu sesuai urutan yang kita berikan.",
            "Agar tampilan antarmuka aplikasi menjadi bersinar warna-warni.",
            "Agar file program menjadi sangat besar dan berat saat disimpan.",
            "Karena komputer hanya bisa memahami perintah jika disusun secara acak."
        ],
        correct: 0
    }
];

// Puzzle Levels Definitions
const PUZZLE_LEVELS = {
    1: {
        id: 1,
        title: "Teka-Teki 1: Urutan Pagi Hari",
        concept: "Konsep: Sekuensial",
        instruction: "Urutkan aktivitas pagi hari dari bangun tidur hingga pergi ke sekolah agar membentuk algoritma harian yang logis!",
        blocks: [
            { id: "p1-1", text: "Bangun Tidur", correctOrder: 0 },
            { id: "p1-2", text: "Mandi Pagi", correctOrder: 1 },
            { id: "p1-3", text: "Sarapan Pagi", correctOrder: 2 },
            { id: "p1-4", text: "Pergi ke Sekolah", correctOrder: 3 }
        ]
    },
    2: {
        id: 2,
        title: "Teka-Teki 2: Membuat Teh Hangat",
        concept: "Konsep: Algoritma Sekuensial",
        instruction: "Urutkan langkah-langkah membuat secangkir teh hangat manis secara tepat!",
        blocks: [
            { id: "p2-1", text: "Masukkan Kantong Teh & Gula ke Gelas", correctOrder: 0 },
            { id: "p2-2", text: "Tuangkan Air Panas Secukupnya", correctOrder: 1 },
            { id: "p2-3", text: "Aduk Air Hingga Gula Larut", correctOrder: 2 },
            { id: "p2-4", text: "Secangkir Teh Hangat Siap Dinikmati", correctOrder: 3 }
        ]
    },
    3: {
        id: 3,
        title: "Teka-Teki 3: Menyeberang Jalan",
        concept: "Konsep: Kondisional (If-Else)",
        instruction: "Bantu Albi mengambil keputusan aman untuk menyeberang jalan berdasarkan warna lampu lalu lintas!",
        blocks: [
            { id: "p3-1", text: "Cek Warna Lampu Lalu Lintas", correctOrder: 0 },
            { id: "p3-2", text: "JIKA Lampu Merah untuk Kendaraan:", correctOrder: 1 },
            { id: "p3-3", text: "  Mulai Menyeberang dengan Aman", correctOrder: 2 },
            { id: "p3-4", text: "SEBALIKNYA (Jika Lampu Hijau):", correctOrder: 3 },
            { id: "p3-5", text: "  Berdiri di Trotoar dan Menunggu", correctOrder: 4 }
        ]
    },
    4: {
        id: 4,
        title: "Teka-Teki 4: Mengambil Sampah Berulang",
        concept: "Konsep: Perulangan (Loop)",
        instruction: "Susun perintah loop untuk mengambil 3 buah botol plastik di lantai secara otomatis!",
        blocks: [
            { id: "p4-1", text: "Ulangi 3 Kali:", correctOrder: 0 },
            { id: "p4-2", text: "  Maju 1 Langkah", correctOrder: 1 },
            { id: "p4-3", text: "  Pungut Botol Plastik", correctOrder: 2 },
            { id: "p4-4", text: "Tumpukan Sampah Bersih!", correctOrder: 3 }
        ]
    },
    5: {
        id: 5,
        title: "Teka-Teki 5: Logika Terbesar (Master)",
        concept: "Konsep: Logika Kompleks",
        instruction: "Urutkan jalannya algoritma untuk membandingkan dua angka A dan B, lalu mencetak nilai yang paling besar!",
        blocks: [
            { id: "p5-1", text: "Mulai Program", correctOrder: 0 },
            { id: "p5-2", text: "Baca Nilai A dan Nilai B", correctOrder: 1 },
            { id: "p5-3", text: "JIKA Nilai A lebih besar dari B:", correctOrder: 2 },
            { id: "p5-4", text: "  Tampilkan Nilai A ke Layar", correctOrder: 3 },
            { id: "p5-5", text: "SEBALIKNYA:", correctOrder: 4 },
            { id: "p5-6", text: "  Tampilkan Nilai B ke Layar", correctOrder: 5 }
        ]
    },
    6: {
        id: 6,
        title: "Teka-Teki 6: Membaca Buku Perpustakaan",
        concept: "Konsep: Sekuensial Lanjutan",
        instruction: "Urutkan prosedur standar saat berkunjung ke perpustakaan untuk meminjam dan membaca buku secara logis!",
        blocks: [
            { id: "p6-1", text: "Cari Judul Buku di Komputer Katalog", correctOrder: 0 },
            { id: "p6-2", text: "Temukan Rak Sesuai Kode Klasifikasi", correctOrder: 1 },
            { id: "p6-3", text: "Ambil Buku dan Bawa ke Meja Baca", correctOrder: 2 },
            { id: "p6-4", text: "Kembalikan Buku ke Keranjang Pengembalian", correctOrder: 3 }
        ]
    },
    7: {
        id: 7,
        title: "Teka-Teki 7: Verifikasi Akun Baru",
        concept: "Konsep: Kondisional Bersarang",
        instruction: "Urutkan langkah login aplikasi dengan pengecekan username dan password!",
        blocks: [
            { id: "p7-1", text: "Masukkan Username dan Password", correctOrder: 0 },
            { id: "p7-2", text: "JIKA Password Sesuai:", correctOrder: 1 },
            { id: "p7-3", text: "  Masuk ke Halaman Dashboard Utama", correctOrder: 2 },
            { id: "p7-4", text: "SEBALIKNYA:", correctOrder: 3 },
            { id: "p7-5", text: "  Tampilkan Pesan 'Password Salah, Coba Lagi'", correctOrder: 4 }
        ]
    },
    8: {
        id: 8,
        title: "Teka-Teki 8: Menyiram Tanaman Berulang",
        concept: "Konsep: Loop Tingkat Lanjut",
        instruction: "Susun loop untuk menyiram 5 pot tanaman bunga di kebun secara teratur!",
        blocks: [
            { id: "p8-1", text: "Ulangi 5 Kali (Untuk Setiap Tanaman):", correctOrder: 0 },
            { id: "p8-2", text: "  Berjalan ke Arah Pot Tanaman Berikutnya", correctOrder: 1 },
            { id: "p8-3", text: "  Tuangkan Secangkir Air ke Dalam Tanah", correctOrder: 2 },
            { id: "p8-4", text: "Semua Bunga Segar dan Selesai Disiram", correctOrder: 3 }
        ]
    },
    9: {
        id: 9,
        title: "Teka-Teki 9: Membuat Telur Rebus",
        concept: "Konsep: Pemantauan Kondisi",
        instruction: "Urutkan proses merebus telur setengah matang dengan batasan sensor waktu!",
        blocks: [
            { id: "p9-1", text: "Didihkan Air di Dalam Panci", correctOrder: 0 },
            { id: "p9-2", text: "Masukkan Telur Perlahan-Lahan", correctOrder: 1 },
            { id: "p9-3", text: "JIKA Timer Telah Berjalan 6 Menit:", correctOrder: 2 },
            { id: "p9-4", text: "  Angkat Telur dan Rendam di Air Dingin", correctOrder: 3 },
            { id: "p9-5", text: "Kupas Kulit Telur dan Sajikan Hangat", correctOrder: 4 }
        ]
    },
    10: {
        id: 10,
        title: "Teka-Teki 10: Pencarian Linear Master",
        concept: "Konsep: Logika Pencarian (Search)",
        instruction: "Urutkan logika pencarian linear untuk menemukan angka target di dalam sebuah barisan acak!",
        blocks: [
            { id: "p10-1", text: "Mulai Pencarian Angka Target X", correctOrder: 0 },
            { id: "p10-2", text: "Untuk Setiap Angka di Barisan (Kiri ke Kanan):", correctOrder: 1 },
            { id: "p10-3", text: "  JIKA Angka Saat Ini Sama dengan X:", correctOrder: 2 },
            { id: "p10-4", text: "    Tampilkan 'Target Ditemukan' dan Selesai", correctOrder: 3 },
            { id: "p10-5", text: "Jika Seluruh Barisan Selesai Dicek & Tidak Ada:", correctOrder: 4 },
            { id: "p10-6", text: "  Tampilkan 'Target Tidak Ada' dan Selesai", correctOrder: 5 }
        ]
    }
};

// Puzzle Game State variables
let currentPuzzleLevel = 1;
let completedPuzzleLevels = [];
let puzzleBlocks = []; // holds current scrambled/player-ordered blocks
let mazeQuizCompleted = false; // true when maze quiz is done

// Game State variables
let currentLevel = 1;
let completedLevels = [];

/* ==========================================================================
   PERSISTENCE / LOCAL STORAGE ENGINE
   ========================================================================== */
const STORAGE_KEY = 'algoquest_game_progress_v1';

function saveProgress() {
    try {
        const data = {
            completedLevels: completedLevels,
            completedPuzzleLevels: completedPuzzleLevels,
            currentPuzzleLevel: currentPuzzleLevel,
            mazeQuizCompleted: mazeQuizCompleted,
            playerName: (dom.displayCertName && dom.displayCertName.innerText) ? dom.displayCertName.innerText : ''
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.warn('Gagal menyimpan progres:', e);
    }
}

function loadProgress() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            if (Array.isArray(data.completedLevels)) {
                completedLevels = data.completedLevels;
            }
            if (Array.isArray(data.completedPuzzleLevels)) {
                completedPuzzleLevels = data.completedPuzzleLevels;
            }
            if (typeof data.currentPuzzleLevel === 'number') {
                currentPuzzleLevel = data.currentPuzzleLevel;
            }
            if (typeof data.mazeQuizCompleted === 'boolean') {
                mazeQuizCompleted = data.mazeQuizCompleted;
            }
            if (data.playerName && dom.displayCertName) {
                dom.displayCertName.innerText = data.playerName;
            }
        }
    } catch (e) {
        console.warn('Gagal memuat progres:', e);
    }
}

function isPuzzleLevelUnlocked(levelId) {
    return levelId === 1 || completedPuzzleLevels.includes(levelId - 1);
}

function getHighestUnlockedPuzzleLevel() {
    const totalPuzzles = Object.keys(PUZZLE_LEVELS).length;
    for (let i = totalPuzzles; i >= 1; i--) {
        if (isPuzzleLevelUnlocked(i)) {
            return i;
        }
    }
    return 1;
}

function renderPuzzleLevelSelect() {
    if (!dom.puzzleLevelSelect) return;
    dom.puzzleLevelSelect.innerHTML = '';
    const totalPuzzles = Object.keys(PUZZLE_LEVELS).length;

    for (let i = 1; i <= totalPuzzles; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        const isUnlocked = isPuzzleLevelUnlocked(i);
        const isDone = completedPuzzleLevels.includes(i);

        let prefix = isDone ? '✓ ' : (isUnlocked ? '• ' : '🔒 ');
        opt.innerText = `${prefix}Teka-Teki ${i}`;
        opt.disabled = !isUnlocked;
        if (i === currentPuzzleLevel) {
            opt.selected = true;
        }
        dom.puzzleLevelSelect.appendChild(opt);
    }
}

function resetAllProgress() {
    if (confirm("Apakah kamu yakin ingin menghapus seluruh riwayat dan mengulang game dari awal?")) {
        completedLevels = [];
        completedPuzzleLevels = [];
        currentPuzzleLevel = 1;
        mazeQuizCompleted = false;
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {}
        if (dom.displayCertName) dom.displayCertName.innerText = '';
        renderLevelsSelector();
        updateCertificateCard();
        alert("Progres game berhasil direset ke awal.");
    }
}

let workspaceBlocks = []; // format: { id, type, loopCount, children: [] }
let robotPos = { x: 0, y: 0, dir: 'UP' }; // current state in simulation
let executionQueue = [];
let isExecuting = false;
let executionInterval = null;
let activeWorkspaceTarget = null; // null means root workspace, otherwise references loop block ID

// Drag & Drop state
let dragState = {
    source: null,      // 'toolbox' | 'workspace'
    type: null,        // block type string
    loopCount: 2,      // for loop blocks dragged from toolbox
    id: null,          // id of workspace block being reordered
    parentId: null     // parent loop id if reordering from nested
};

let quizIndex = 0;
let quizScore = 0;

// DOM Elements cache
const dom = {
    landingPage: document.getElementById('landing-page'),
    levelSelectorPage: document.getElementById('level-selector-page'),
    gameArenaPage: document.getElementById('game-arena-page'),
    quizPage: document.getElementById('quiz-page'),
    certificatePage: document.getElementById('certificate-page'),

    modeMazeBtn: document.getElementById('mode-maze-btn'),
    modePuzzleBtn: document.getElementById('mode-puzzle-btn'),
    modeCertBtn: document.getElementById('mode-cert-btn'),
    certLockLabel: document.getElementById('cert-lock-label'),
    puzzleGamePage: document.getElementById('puzzle-game-page'),
    backToModeBtn: document.getElementById('back-to-mode-btn'),
    puzzleLevelTitle: document.getElementById('puzzle-level-title'),
    puzzleLevelTag: document.getElementById('puzzle-level-tag'),
    puzzleIntroText: document.getElementById('puzzle-intro-text'),
    puzzleBlocksList: document.getElementById('puzzle-blocks-list'),
    puzzleLevelCounter: document.getElementById('puzzle-level-counter'),
    puzzleLevelSelect: document.getElementById('puzzle-level-select'),
    verifyPuzzleBtn: document.getElementById('verify-puzzle-btn'),
    audioToggleBtn: document.getElementById('audio-toggle-btn'),
    audioIconPath: document.getElementById('audio-icon-path'),
    resetProgressBtn: document.getElementById('reset-progress-btn'),

    levelsGrid: document.querySelector('.levels-grid'),
    quizLockedCard: document.getElementById('quiz-locked-card'),
    quizUnlockedCard: document.getElementById('quiz-unlocked-card'),
    startQuizBtn: document.getElementById('start-quiz-btn'),

    backToHomeBtns: document.querySelectorAll('.back-to-home'),
    backToSelectorBtn: document.getElementById('back-to-selector'),
    clearWorkspaceBtn: document.getElementById('clear-workspace-btn'),
    runProgramBtn: document.getElementById('run-program-btn'),
    stopProgramBtn: document.getElementById('stop-program-btn'),

    currentLevelTitle: document.getElementById('current-level-title'),
    currentLevelTag: document.getElementById('current-level-tag'),
    levelIntroText: document.getElementById('level-intro-text'),
    gridContainer: document.getElementById('grid-container'),
    toolboxBlocksList: document.getElementById('toolbox-blocks-list'),
    workspaceBlocksStack: document.getElementById('workspace-blocks-stack'),
    workspaceCounter: document.getElementById('workspace-counter'),

    quizProgressFill: document.getElementById('quiz-progress-fill'),
    quizCounterText: document.getElementById('quiz-counter-text'),
    quizQuestionText: document.getElementById('quiz-question-text'),
    quizOptionsContainer: document.getElementById('quiz-options-container'),
    nextQuestionBtn: document.getElementById('next-question-btn'),

    playerCertName: document.getElementById('player-cert-name'),
    saveCertNameBtn: document.getElementById('save-cert-name-btn'),
    certNameEditView: document.getElementById('cert-name-edit-view'),
    certNameFinalView: document.getElementById('cert-name-final-view'),
    displayCertName: document.getElementById('display-cert-name'),
    certDateText: document.getElementById('cert-date-text'),
    printCertBtn: document.getElementById('print-cert-btn'),

    // Modals
    successModal: document.getElementById('success-modal'),
    successModalTitle: document.getElementById('success-modal-title'),
    successModalDesc: document.getElementById('success-modal-desc'),
    successLearningInsight: document.getElementById('success-learning-insight'),
    successRetryBtn: document.getElementById('success-retry-btn'),
    successNextBtn: document.getElementById('success-next-btn'),

    failureModal: document.getElementById('failure-modal'),
    failureModalTitle: document.getElementById('failure-modal-title'),
    failureModalDesc: document.getElementById('failure-modal-desc'),
    failureModalHint: document.getElementById('failure-modal-hint'),
    failureCloseBtn: document.getElementById('failure-close-btn')
};

// SVG templates for procedural rendering (Crisp, modern graphics)
const SVGS = {
    robot: (dir) => {
        let rotation = 0;
        if (dir === 'RIGHT') rotation = 90;
        if (dir === 'DOWN') rotation = 180;
        if (dir === 'LEFT') rotation = 270;
        return `
        <svg viewBox="0 0 100 100" class="robot-agent" style="transform: rotate(${rotation}deg)">
            <!-- Head & Antenna -->
            <rect x="35" y="10" width="30" height="25" rx="5" fill="#06b6d4" stroke="#083344" stroke-width="3"/>
            <line x1="50" y1="10" x2="50" y2="3" stroke="#eab308" stroke-width="4" stroke-linecap="round"/>
            <circle cx="50" cy="2" r="3" fill="#f43f5e"/>
            
            <!-- Eyes (Glowing neon) -->
            <rect x="42" y="18" width="6" height="6" rx="1" fill="#fff" filter="drop-shadow(0 0 3px #06b6d4)"/>
            <rect x="52" y="18" width="6" height="6" rx="1" fill="#fff" filter="drop-shadow(0 0 3px #06b6d4)"/>
            
            <!-- Neck -->
            <rect x="46" y="35" width="8" height="6" fill="#64748b"/>
            
            <!-- Body -->
            <rect x="25" y="41" width="50" height="40" rx="8" fill="#0f172a" stroke="#06b6d4" stroke-width="4" filter="drop-shadow(0 0 5px rgba(6,182,212,0.3))"/>
            
            <!-- Details inside body -->
            <rect x="35" y="48" width="30" height="15" rx="3" fill="#1e293b"/>
            <circle cx="42" cy="55" r="3" fill="#10b981"/>
            <circle cx="50" cy="55" r="3" fill="#eab308"/>
            <circle cx="58" cy="55" r="3" fill="#f43f5e"/>
            
            <!-- Arms -->
            <rect x="18" y="46" width="6" height="20" rx="3" fill="#0891b2"/>
            <rect x="76" y="46" width="6" height="20" rx="3" fill="#0891b2"/>
            
            <!-- Tracks/Wheels -->
            <rect x="30" y="81" width="12" height="10" rx="2" fill="#334155"/>
            <rect x="58" y="81" width="12" height="10" rx="2" fill="#334155"/>
        </svg>
        `;
    },
    portal: `
    <svg viewBox="0 0 100 100" class="portal-goal">
        <!-- Outer glowing ring -->
        <circle cx="50" cy="50" r="40" fill="none" stroke="#a855f7" stroke-width="4" stroke-dasharray="10 5" filter="drop-shadow(0 0 8px #a855f7)"/>
        <!-- Inner swirling portal -->
        <circle cx="50" cy="50" r="30" fill="url(#portal-gradient)"/>
        <path d="M50 20 A30 30 0 0 0 20 50 A30 30 0 0 0 50 80" fill="none" stroke="#06b6d4" stroke-width="2" opacity="0.7"/>
        
        <defs>
            <radialGradient id="portal-gradient">
                <stop offset="0%" stop-color="#020617" />
                <stop offset="70%" stop-color="#7c3aed" />
                <stop offset="100%" stop-color="#06b6d4" />
            </radialGradient>
        </defs>
    </svg>
    `
};

/* ==========================================================================
   INITIALIZATION & NAVIGATION
   ========================================================================== */
function initApp() {
    loadProgress();
    setupEventListeners();
    renderLevelsSelector();
    updateAudioIcon();
    updateCertificateCard();

    // Auto date for Certificate
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    dom.certDateText.innerText = now.toLocaleDateString('id-ID', options);
}

function setupEventListeners() {
    // Navigation - Game Mode Selection
    dom.modeMazeBtn.addEventListener('click', () => {
        synth.playClick();
        showScreen('level-selector-page');
    });

    dom.modePuzzleBtn.addEventListener('click', () => {
        synth.playClick();
        let targetLvl = currentPuzzleLevel || 1;
        if (!isPuzzleLevelUnlocked(targetLvl)) {
            targetLvl = getHighestUnlockedPuzzleLevel();
        }
        loadPuzzleLevel(targetLvl);
    });

    if (dom.puzzleLevelSelect) {
        dom.puzzleLevelSelect.addEventListener('change', (e) => {
            const selectedLvl = parseInt(e.target.value, 10);
            if (selectedLvl && isPuzzleLevelUnlocked(selectedLvl)) {
                synth.playClick();
                loadPuzzleLevel(selectedLvl);
            }
        });
    }

    dom.modeCertBtn.addEventListener('click', () => {
        const totalPuzzles = Object.keys(PUZZLE_LEVELS).length;
        const mazeDone = completedLevels.length >= 10;
        const puzzleDone = completedPuzzleLevels.length >= totalPuzzles;
        const allDone = mazeDone && puzzleDone;

        if (allDone) {
            synth.playClick();
            if (mazeQuizCompleted) {
                dom.certNameFinalView.classList.add('hidden');
                dom.certNameEditView.classList.remove('hidden');
                dom.printCertBtn.classList.add('hidden');
                dom.playerCertName.value = '';
                showScreen('certificate-page');
            } else {
                startQuiz();
            }
        } else {
            synth.playWrong();
            alert("Sertifikat belum bisa diakses! Kamu harus menyelesaikan seluruh 10 Level Mode Labirin (Maze) dan seluruh 10 Level Mode Teka-Teki (Puzzle) terlebih dahulu.");
        }
    });

    dom.backToModeBtn.addEventListener('click', () => {
        synth.playClick();
        showScreen('landing-page');
    });

    dom.verifyPuzzleBtn.addEventListener('click', () => {
        checkPuzzleSolution();
    });

    dom.audioToggleBtn.addEventListener('click', () => {
        const isEnabled = synth.toggle();
        updateAudioIcon();
        if (isEnabled) {
            synth.playClick();
        }
    });

    dom.backToHomeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            synth.playClick();
            showScreen('landing-page');
        });
    });

    dom.backToSelectorBtn.addEventListener('click', () => {
        synth.playClick();
        showScreen('level-selector-page');
        renderLevelsSelector(); // refresh completed stamps
    });

    // Level Action
    dom.successNextBtn.addEventListener('click', () => {
        dom.successModal.classList.remove('active');
        if (currentLevel < 10) {
            loadLevel(currentLevel + 1);
        } else {
            // All levels done — unlock Quiz
            showScreen('level-selector-page');
            renderLevelsSelector();
        }
    });

    dom.successRetryBtn.addEventListener('click', () => {
        dom.successModal.classList.remove('active');
        loadLevel(currentLevel);
    });

    dom.failureCloseBtn.addEventListener('click', () => {
        dom.failureModal.classList.remove('active');
        resetSimulation();
    });

    // Workspace Actions
    dom.clearWorkspaceBtn.addEventListener('click', () => {
        synth.playClick();
        workspaceBlocks = [];
        activeWorkspaceTarget = null;
        renderWorkspace();
    });

    dom.runProgramBtn.addEventListener('click', () => {
        runProgram();
    });

    dom.stopProgramBtn.addEventListener('click', () => {
        stopProgram();
    });

    // Quiz Actions
    dom.startQuizBtn.addEventListener('click', () => {
        synth.playClick();
        startQuiz();
    });

    dom.nextQuestionBtn.addEventListener('click', () => {
        synth.playClick();
        nextQuizQuestion();
    });

    // Certificate Actions
    dom.saveCertNameBtn.addEventListener('click', () => {
        const nameVal = dom.playerCertName.value.trim();
        if (nameVal) {
            synth.playCorrect();
            dom.displayCertName.innerText = nameVal;
            dom.certNameEditView.classList.add('hidden');
            dom.certNameFinalView.classList.remove('hidden');
            dom.printCertBtn.classList.remove('hidden');
            saveProgress();
        } else {
            synth.playWrong();
            alert("Harap masukkan nama lengkap Anda!");
        }
    });

    if (dom.resetProgressBtn) {
        dom.resetProgressBtn.addEventListener('click', () => {
            synth.playClick();
            resetAllProgress();
        });
    }

    dom.printCertBtn.addEventListener('click', () => {
        synth.playClick();
        window.print();
    });

    // ---- DRAG & DROP: Workspace area drop target ----
    const ws = dom.workspaceBlocksStack;

    ws.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        ws.classList.add('drag-over-highlight');
        // Show bottom drop indicator when hovering near end
        const allIndicators = ws.querySelectorAll('.drop-zone-indicator');
        allIndicators.forEach(ind => ind.classList.remove('drop-zone-active'));
        const lastInd = ws.querySelector('.drop-zone-indicator:last-child');
        if (lastInd) lastInd.classList.add('drop-zone-active');
    });

    ws.addEventListener('dragleave', (e) => {
        // Only remove highlight if truly leaving workspace (not entering a child)
        if (!ws.contains(e.relatedTarget)) {
            ws.classList.remove('drag-over-highlight');
            ws.querySelectorAll('.drop-zone-indicator').forEach(i => i.classList.remove('drop-zone-active'));
        }
    });

    ws.addEventListener('drop', (e) => {
        e.preventDefault();
        ws.classList.remove('drag-over-highlight');
        ws.querySelectorAll('.drop-zone-indicator').forEach(i => i.classList.remove('drop-zone-active'));
        // Drop at end of root workspace
        handleWorkspaceDrop(null, workspaceBlocks.length);
    });
}

function showScreen(screenId) {
    document.querySelectorAll('.view-screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const activeScreen = document.getElementById(screenId);
    activeScreen.classList.add('active');
}

function updateAudioIcon() {
    if (synth.enabled) {
        // Sound on SVG path
        dom.audioIconPath.setAttribute('d', 'M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.5A2.25 2.25 0 002.25 9.75v4.5c0 1.242 1.008 2.25 2.25 2.25h1.94l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06zM18.57 17.47a.75.75 0 11-1.06-1.06 5.25 5.25 0 000-7.42.75.75 0 111.06-1.06 6.75 6.75 0 010 9.54z M21.3 20.2a.75.75 0 11-1.06-1.06 9.15 9.15 0 000-12.96.75.75 0 111.06-1.06 10.65 10.65 0 010 15.08z');
        dom.audioToggleBtn.style.borderColor = 'var(--color-cyan)';
        dom.audioToggleBtn.style.color = 'var(--color-cyan)';
    } else {
        // Sound off/muted SVG path
        dom.audioIconPath.setAttribute('d', 'M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.5A2.25 2.25 0 002.25 9.75v4.5c0 1.242 1.008 2.25 2.25 2.25h1.94l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06zM17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 001.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 101.06-1.06L20.56 12l1.72-1.72a.75.75 0 00-1.06-1.06l-1.72 1.72-1.72-1.72z');
        dom.audioToggleBtn.style.borderColor = 'var(--panel-border)';
        dom.audioToggleBtn.style.color = 'var(--text-muted)';
    }
}


/* ==========================================================================
   LEVEL SELECTOR MANAGEMENT
   ========================================================================== */
function renderLevelsSelector() {
    dom.levelsGrid.innerHTML = '';

    // Check if previous levels are completed to unlock the next one
    let allCompleted = true;

    for (let id = 1; id <= 10; id++) {
        const lvl = LEVELS[id];
        const isUnlocked = id === 1 || completedLevels.includes(id - 1);
        const isCompleted = completedLevels.includes(id);

        if (!isCompleted) allCompleted = false;

        const card = document.createElement('div');
        card.className = `level-card glass-panel ${isUnlocked ? 'unlocked' : 'locked'} ${isCompleted ? 'completed' : ''}`;
        card.setAttribute('data-level', id);

        // Map Level Badges
        let badgeClass = 'seq';
        if (id === 2) badgeClass = 'loop';
        if (id === 3) badgeClass = 'cond';
        if (id === 4) badgeClass = 'debug';
        if (id === 5) badgeClass = 'loop';
        if (id === 6) badgeClass = 'cond';
        if (id === 7) badgeClass = 'loop';
        if (id === 8) badgeClass = 'seq';
        if (id === 9) badgeClass = 'debug';
        if (id === 10) badgeClass = 'cond';

        card.innerHTML = `
            <div class="level-num">${id}</div>
            <div class="level-badge ${badgeClass}">${lvl.concept.split(': ')[1]}</div>
            <h3>${lvl.title}</h3>
            <p>${lvl.instruction}</p>
            <button class="btn btn-level-action" ${isUnlocked ? '' : 'disabled'}>
                ${isCompleted ? 'Main Lagi' : (isUnlocked ? 'Mulai Misi' : 'Terkunci')}
            </button>
        `;

        if (isUnlocked) {
            card.addEventListener('click', () => {
                synth.playClick();
                loadLevel(id);
            });
        }

        dom.levelsGrid.appendChild(card);
    }

    // Quiz Unlock Card Handling
    if (dom.quizLockedCard && dom.quizUnlockedCard) {
        if (completedLevels.length >= 10) {
            dom.quizLockedCard.classList.add('hidden');
            dom.quizUnlockedCard.classList.remove('hidden');
        } else {
            dom.quizLockedCard.classList.remove('hidden');
            dom.quizUnlockedCard.classList.add('hidden');
        }
    }
}


/* ==========================================================================
   GAME LEVEL SETUP & GRID RENDERING
   ========================================================================== */
function loadLevel(levelId) {
    currentLevel = levelId;
    const lvl = LEVELS[levelId];

    dom.currentLevelTitle.innerText = lvl.title;
    dom.currentLevelTag.innerText = lvl.concept;

    // Dynamic styles based on levels
    dom.currentLevelTag.className = 'level-concept-tag';
    if (levelId === 1) dom.currentLevelTag.classList.add('seq');
    if (levelId === 2) dom.currentLevelTag.classList.add('loop');
    if (levelId === 3) dom.currentLevelTag.classList.add('cond');
    if (levelId === 4) dom.currentLevelTag.classList.add('debug');
    if (levelId === 5) dom.currentLevelTag.classList.add('loop');
    if (levelId === 6) dom.currentLevelTag.classList.add('cond');
    if (levelId === 7) dom.currentLevelTag.classList.add('loop');
    if (levelId === 8) dom.currentLevelTag.classList.add('seq');
    if (levelId === 9) dom.currentLevelTag.classList.add('debug');
    if (levelId === 10) dom.currentLevelTag.classList.add('cond');

    dom.levelIntroText.innerText = lvl.instruction;

    // Reset workspace and setup block drawer
    workspaceBlocks = [];
    activeWorkspaceTarget = null;

    // Load pre-configured workspace for Debugging levels
    if (lvl.debuggingSetup) {
        // Deep copy of buggy block array, support nested children for loop blocks
        function buildSetupBlock(b, idx) {
            const block = {
                id: `block-${Date.now()}-${idx}-${Math.random()}`,
                type: b.type,
                loopCount: b.loopCount || 2,
                children: []
            };
            if (b.children && b.children.length > 0) {
                block.children = b.children.map((child, cIdx) => buildSetupBlock(child, `${idx}-${cIdx}`));
            }
            return block;
        }
        workspaceBlocks = lvl.debuggingSetup.map((b, idx) => buildSetupBlock(b, idx));
    }

    renderToolbox(lvl.allowedBlocks);
    renderWorkspace();
    resetSimulation();

    showScreen('game-arena-page');
}

function renderToolbox(allowed) {
    dom.toolboxBlocksList.innerHTML = '';

    // Map of block markup
    const blockTemplates = {
        'move': `
            <div class="block-item block-action cursor-pointer" data-type="move">
                <span class="block-icon">↑</span>
                <span class="block-label">Maju 1 Langkah</span>
            </div>`,
        'turn-left': `
            <div class="block-item block-action cursor-pointer" data-type="turn-left">
                <span class="block-icon">↶</span>
                <span class="block-label">Belok Kiri</span>
            </div>`,
        'turn-right': `
            <div class="block-item block-action cursor-pointer" data-type="turn-right">
                <span class="block-icon">↷</span>
                <span class="block-label">Belok Kanan</span>
            </div>`,
        'loop': `
            <div class="block-item block-loop cursor-pointer" data-type="loop">
                <span class="block-icon">↻</span>
                <span class="block-label">Ulangi...</span>
                <select class="loop-count-select" onclick="event.stopPropagation()">
                    <option value="2">2 Kali</option>
                    <option value="3">3 Kali</option>
                    <option value="4">4 Kali</option>
                    <option value="5">5 Kali</option>
                    <option value="6">6 Kali</option>
                    <option value="7">7 Kali</option>
                    <option value="8">8 Kali</option>
                    <option value="10">10 Kali</option>
                </select>
            </div>`,
        'if-yellow': `
            <div class="block-item block-conditional cursor-pointer" data-type="if-yellow">
                <span class="block-icon">?</span>
                <span class="block-label">Jika Ubin Kuning -> Belok Kanan</span>
            </div>`,
        'if-purple': `
            <div class="block-item block-conditional cursor-pointer" data-type="if-purple">
                <span class="block-icon">?</span>
                <span class="block-label">Jika Ubin Ungu -> Belok Kiri</span>
            </div>`
    };

    allowed.forEach(type => {
        if (blockTemplates[type]) {
            const container = document.createElement('div');
            container.innerHTML = blockTemplates[type].trim();
            const el = container.firstChild;

            // --- Click to add ---
            el.addEventListener('click', (e) => {
                let loopVal = 2;
                if (type === 'loop') {
                    const sel = el.querySelector('select');
                    loopVal = parseInt(sel.value, 10);
                }
                addBlockToWorkspace(type, loopVal);
            });

            // --- Drag to add ---
            el.setAttribute('draggable', 'true');
            el.addEventListener('dragstart', (e) => {
                let loopVal = 2;
                if (type === 'loop') {
                    const sel = el.querySelector('select');
                    if (sel) loopVal = parseInt(sel.value, 10);
                }
                dragState.source = 'toolbox';
                dragState.type = type;
                dragState.loopCount = loopVal;
                dragState.id = null;
                dragState.parentId = null;
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('text/plain', type);
                el.classList.add('block-dragging');
                // Small ghost image
                setTimeout(() => el.classList.add('block-dragging'), 0);
            });
            el.addEventListener('dragend', () => {
                el.classList.remove('block-dragging');
                dragState.source = null;
            });

            dom.toolboxBlocksList.appendChild(el);
        }
    });
}

function renderGrid() {
    const lvl = LEVELS[currentLevel];
    dom.gridContainer.innerHTML = '';
    dom.gridContainer.style.gridTemplateColumns = `repeat(${lvl.gridSize}, 1fr)`;
    dom.gridContainer.style.gridTemplateRows = `repeat(${lvl.gridSize}, 1fr)`;

    // Draw bottom-up coordinates: row = 0 is top-most, col = 0 is left-most
    for (let r = 0; r < lvl.gridSize; r++) {
        for (let c = 0; c < lvl.gridSize; c++) {
            const tile = document.createElement('div');
            tile.className = 'grid-tile';
            tile.setAttribute('data-x', c);
            tile.setAttribute('data-y', r);

            // Wall check
            const isWall = lvl.walls.some(w => w.x === c && w.y === r);
            if (isWall) {
                tile.classList.add('wall');
            }

            // Yellow sensor check
            const isYellow = lvl.yellowTiles && lvl.yellowTiles.some(t => t.x === c && t.y === r);
            if (isYellow) {
                tile.classList.add('yellow-sensor');
            }

            // Purple sensor check
            const isPurple = lvl.purpleTiles && lvl.purpleTiles.some(t => t.x === c && t.y === r);
            if (isPurple) {
                tile.classList.add('purple-sensor');
            }

            // Portal / Goal
            if (lvl.goal.x === c && lvl.goal.y === r) {
                tile.innerHTML = SVGS.portal;
            }

            dom.gridContainer.appendChild(tile);
        }
    }

    // Place Robot
    placeRobotElement();
}

function placeRobotElement() {
    // Remove existing robot
    const oldRobot = dom.gridContainer.querySelector('.robot-agent');
    if (oldRobot) oldRobot.remove();

    // Get current position tile
    const targetTile = dom.gridContainer.querySelector(`[data-x="${robotPos.x}"][data-y="${robotPos.y}"]`);
    if (targetTile) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = SVGS.robot(robotPos.dir).trim();
        const robotSvg = wrapper.firstChild;
        targetTile.appendChild(robotSvg);
    }
}

function resetSimulation() {
    const lvl = LEVELS[currentLevel];
    robotPos = { ...lvl.start };

    // Remove any path/step highlights
    const tiles = dom.gridContainer.querySelectorAll('.grid-tile');
    tiles.forEach(t => t.classList.remove('active-step'));

    renderGrid();
    stopProgram();
}


/* ==========================================================================
   WORKSPACE STACK & BLOCK BUILDING
   ========================================================================== */
function addBlockToWorkspace(type, loopCount = 2) {
    synth.playClick();

    const lvl = LEVELS[currentLevel];
    const totalBlocks = countTotalBlocks(workspaceBlocks);

    if (totalBlocks >= lvl.maxBlocks) {
        alert(`Batas maksimal blok untuk misi ini adalah ${lvl.maxBlocks} blok!`);
        return;
    }

    const newBlock = {
        id: `block-${Date.now()}-${Math.random()}`,
        type: type,
        loopCount: loopCount,
        children: [] // for nested loops
    };

    if (activeWorkspaceTarget) {
        // Add to nested container of the active loop block
        const targetLoop = findBlockById(workspaceBlocks, activeWorkspaceTarget);
        if (targetLoop && targetLoop.type === 'loop') {
            targetLoop.children.push(newBlock);
        } else {
            // Target invalid, fallback
            workspaceBlocks.push(newBlock);
            activeWorkspaceTarget = null;
        }
    } else {
        // Standard append to root workspace
        workspaceBlocks.push(newBlock);
    }

    renderWorkspace();
}

function deleteBlock(blockId, e) {
    if (e) e.stopPropagation();
    synth.playClick();

    workspaceBlocks = removeBlockById(workspaceBlocks, blockId);

    if (activeWorkspaceTarget === blockId) {
        activeWorkspaceTarget = null;
    }

    renderWorkspace();
}

function toggleActiveLoopTarget(loopId, e) {
    if (e) e.stopPropagation();
    synth.playClick();

    if (activeWorkspaceTarget === loopId) {
        activeWorkspaceTarget = null; // deselect
    } else {
        activeWorkspaceTarget = loopId; // select this loop container
    }
    renderWorkspace();
}

function changeLoopCount(loopId, newVal, e) {
    if (e) e.stopPropagation();
    const block = findBlockById(workspaceBlocks, loopId);
    if (block) {
        block.loopCount = parseInt(newVal, 10);
    }
}

// Tree Traversal Helpers
function findBlockById(arr, id) {
    for (let item of arr) {
        if (item.id === id) return item;
        if (item.children && item.children.length > 0) {
            const found = findBlockById(item.children, id);
            if (found) return found;
        }
    }
    return null;
}

function removeBlockById(arr, id) {
    return arr.filter(item => {
        if (item.id === id) return false;
        if (item.children && item.children.length > 0) {
            item.children = removeBlockById(item.children, id);
        }
        return true;
    });
}

function countTotalBlocks(arr) {
    let count = 0;
    arr.forEach(item => {
        count++;
        if (item.children && item.children.length > 0) {
            count += countTotalBlocks(item.children);
        }
    });
    return count;
}

// Visual Workspace Renderer
function renderWorkspace() {
    dom.workspaceBlocksStack.innerHTML = '';

    const totalCount = countTotalBlocks(workspaceBlocks);
    const lvl = LEVELS[currentLevel];
    dom.workspaceCounter.innerText = `${totalCount} / ${lvl.maxBlocks} Blok Terpakai`;
    if (totalCount > lvl.maxBlocks) {
        dom.workspaceCounter.style.color = 'var(--color-rose)';
    } else {
        dom.workspaceCounter.style.color = 'var(--text-secondary)';
    }

    if (workspaceBlocks.length === 0) {
        // Empty state — still a valid drop target, show placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'empty-workspace-placeholder';
        placeholder.innerHTML = `
            <span class="placeholder-icon">🧩</span>
            <p>Workspace Kosong</p>
            <span>Klik atau <strong style="color:var(--color-cyan)">seret blok</strong> ke sini untuk menyusun algoritmamu.</span>
        `;
        dom.workspaceBlocksStack.appendChild(placeholder);
        // Add a single drop zone at the bottom
        dom.workspaceBlocksStack.appendChild(createDropZone(null, 0));
        return;
    }

    // Build visual DOM tree with drop-zone indicators between every block
    workspaceBlocks.forEach((block, index) => {
        // Drop zone BEFORE each block
        dom.workspaceBlocksStack.appendChild(createDropZone(null, index));
        dom.workspaceBlocksStack.appendChild(createVisualBlockElement(block, index, false));
    });
    // Drop zone AFTER last block
    dom.workspaceBlocksStack.appendChild(createDropZone(null, workspaceBlocks.length));
}

function createVisualBlockElement(block, index, isNested = false, parentBlockId = null) {
    const wrapper = document.createElement('div');
    wrapper.className = 'block-nested-wrapper';
    wrapper.setAttribute('data-block-id', block.id);
    wrapper.setAttribute('data-index', index);
    if (parentBlockId) wrapper.setAttribute('data-parent-id', parentBlockId);

    const blockEl = document.createElement('div');
    blockEl.id = block.id;
    blockEl.setAttribute('data-type', block.type);
    // Make every workspace block draggable for reordering
    blockEl.setAttribute('draggable', 'true');
    blockEl.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        dragState.source = 'workspace';
        dragState.type = block.type;
        dragState.loopCount = block.loopCount || 2;
        dragState.id = block.id;
        dragState.parentId = parentBlockId;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', block.id);
        blockEl.classList.add('block-dragging');
    });
    blockEl.addEventListener('dragend', () => {
        blockEl.classList.remove('block-dragging');
        dragState.source = null;
        // Re-render to clean up any stuck states
        renderWorkspace();
    });

    let content = '';

    if (block.type === 'move') {
        blockEl.className = 'block-item block-action';
        content = `
            <span class="block-icon">↑</span>
            <span class="block-label">Maju 1 Langkah</span>
            <button class="delete-block-btn" onclick="deleteBlock('${block.id}', event)">✖</button>
        `;
    } else if (block.type === 'turn-left') {
        blockEl.className = 'block-item block-action';
        content = `
            <span class="block-icon">↶</span>
            <span class="block-label">Belok Kiri</span>
            <button class="delete-block-btn" onclick="deleteBlock('${block.id}', event)">✖</button>
        `;
    } else if (block.type === 'turn-right') {
        blockEl.className = 'block-item block-action';
        content = `
            <span class="block-icon">↷</span>
            <span class="block-label">Belok Kanan</span>
            <button class="delete-block-btn" onclick="deleteBlock('${block.id}', event)">✖</button>
        `;
    } else if (block.type === 'if-yellow') {
        blockEl.className = 'block-item block-conditional';
        content = `
            <span class="block-icon">?</span>
            <span class="block-label">Jika Ubin Kuning -> Belok Kanan</span>
            <button class="delete-block-btn" onclick="deleteBlock('${block.id}', event)">✖</button>
        `;
    } else if (block.type === 'if-purple') {
        blockEl.className = 'block-item block-conditional';
        content = `
            <span class="block-icon">?</span>
            <span class="block-label">Jika Ubin Ungu -> Belok Kiri</span>
            <button class="delete-block-btn" onclick="deleteBlock('${block.id}', event)">✖</button>
        `;
    } else if (block.type === 'loop') {
        const isTarget = activeWorkspaceTarget === block.id;
        blockEl.className = `block-item block-loop ${isTarget ? 'executing-highlight' : ''}`;
        blockEl.style.cursor = 'pointer';

        // Loop block HTML setup
        content = `
            <span class="block-icon">↻</span>
            <span class="block-label">Ulangi</span>
            <select class="loop-count-select" onchange="changeLoopCount('${block.id}', this.value, event)" onclick="event.stopPropagation()">
                <option value="2" ${block.loopCount === 2 ? 'selected' : ''}>2 Kali</option>
                <option value="3" ${block.loopCount === 3 ? 'selected' : ''}>3 Kali</option>
                <option value="4" ${block.loopCount === 4 ? 'selected' : ''}>4 Kali</option>
                <option value="5" ${block.loopCount === 5 ? 'selected' : ''}>5 Kali</option>
                <option value="6" ${block.loopCount === 6 ? 'selected' : ''}>6 Kali</option>
                <option value="7" ${block.loopCount === 7 ? 'selected' : ''}>7 Kali</option>
                <option value="8" ${block.loopCount === 8 ? 'selected' : ''}>8 Kali</option>
                <option value="10" ${block.loopCount === 10 ? 'selected' : ''}>10 Kali</option>
            </select>
            <span class="block-label" style="font-size:0.75rem; margin-left:5px; opacity:0.8;">(${isTarget ? 'Menyusun...' : 'Ketuk untuk Susun'})</span>
            <button class="delete-block-btn" onclick="deleteBlock('${block.id}', event)">✖</button>
        `;

        blockEl.addEventListener('click', (e) => {
            toggleActiveLoopTarget(block.id, e);
        });
    }

    blockEl.innerHTML = content;
    wrapper.appendChild(blockEl);

    // If it's a loop, render its nested child elements with drop support
    if (block.type === 'loop') {
        const nestedContainer = document.createElement('div');
        nestedContainer.className = 'nested-workspace-container';
        nestedContainer.setAttribute('data-loop-id', block.id);

        // Drop into nested container
        nestedContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = dragState.source === 'workspace' ? 'move' : 'copy';
            nestedContainer.classList.add('drag-over-highlight');
        });
        nestedContainer.addEventListener('dragleave', (e) => {
            if (!nestedContainer.contains(e.relatedTarget)) {
                nestedContainer.classList.remove('drag-over-highlight');
            }
        });
        nestedContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            nestedContainer.classList.remove('drag-over-highlight');
            handleWorkspaceDrop(block.id, block.children.length);
        });

        if (block.children && block.children.length > 0) {
            block.children.forEach((child, cIndex) => {
                nestedContainer.appendChild(createDropZone(block.id, cIndex));
                nestedContainer.appendChild(createVisualBlockElement(child, cIndex, true, block.id));
            });
            nestedContainer.appendChild(createDropZone(block.id, block.children.length));
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'nested-drop-placeholder';
            placeholder.innerHTML = '<span>⬇ Seret blok ke sini untuk masuk ke loop</span>';
            nestedContainer.appendChild(placeholder);
        }

        wrapper.appendChild(nestedContainer);
    }

    return wrapper;
}

// Creates a thin visible drop zone indicator between blocks
function createDropZone(parentId, insertIndex) {
    const dz = document.createElement('div');
    dz.className = 'drop-zone-indicator';
    dz.setAttribute('data-parent-id', parentId || '');
    dz.setAttribute('data-insert-index', insertIndex);

    dz.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = dragState.source === 'workspace' ? 'move' : 'copy';
        dz.classList.add('drop-zone-active');
    });
    dz.addEventListener('dragleave', () => {
        dz.classList.remove('drop-zone-active');
    });
    dz.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dz.classList.remove('drop-zone-active');
        handleWorkspaceDrop(parentId || null, insertIndex);
    });
    return dz;
}

// Central drop handler: inserts or moves a block into position
function handleWorkspaceDrop(targetParentId, insertIndex) {
    const lvl = LEVELS[currentLevel];

    if (dragState.source === 'toolbox') {
        // Check block limit
        if (countTotalBlocks(workspaceBlocks) >= lvl.maxBlocks) {
            return;
        }
        const newBlock = {
            id: `block-${Date.now()}-${Math.random()}`,
            type: dragState.type,
            loopCount: dragState.loopCount,
            children: []
        };
        if (targetParentId) {
            const parentLoop = findBlockById(workspaceBlocks, targetParentId);
            if (parentLoop && parentLoop.type === 'loop') {
                parentLoop.children.splice(insertIndex, 0, newBlock);
            }
        } else {
            workspaceBlocks.splice(insertIndex, 0, newBlock);
        }
        synth.playClick();
        renderWorkspace();

    } else if (dragState.source === 'workspace' && dragState.id) {
        // Reordering: remove from old position, insert at new position
        const movingBlock = findBlockById(workspaceBlocks, dragState.id);
        if (!movingBlock) return;

        // Clone the block to re-insert
        const blockClone = JSON.parse(JSON.stringify(movingBlock));

        // Find old index in original container before removal to adjust insert index
        let adjustedIndex = insertIndex;
        if (targetParentId === (dragState.parentId || null)) {
            const container = targetParentId ? findBlockById(workspaceBlocks, targetParentId).children : workspaceBlocks;
            const oldIndex = container.findIndex(b => b.id === dragState.id);
            if (oldIndex !== -1 && oldIndex < insertIndex) {
                adjustedIndex = insertIndex - 1;
            }
        }

        // Remove from original position
        if (dragState.parentId) {
            const oldParent = findBlockById(workspaceBlocks, dragState.parentId);
            if (oldParent) {
                oldParent.children = removeBlockById(oldParent.children, dragState.id);
            }
        } else {
            workspaceBlocks = removeBlockById(workspaceBlocks, dragState.id);
        }

        // Insert at new position
        if (targetParentId) {
            const newParent = findBlockById(workspaceBlocks, targetParentId);
            if (newParent && newParent.type === 'loop') {
                const clampedIndex = Math.max(0, Math.min(adjustedIndex, newParent.children.length));
                newParent.children.splice(clampedIndex, 0, blockClone);
            }
        } else {
            const clampedIndex = Math.max(0, Math.min(adjustedIndex, workspaceBlocks.length));
            workspaceBlocks.splice(clampedIndex, 0, blockClone);
        }

        synth.playClick();
        renderWorkspace();
    }
}


/* ==========================================================================
   ALGORITHM COMPILER & RUNTIME INTERPRETER
   ========================================================================== */
function runProgram() {
    if (isExecuting) return;
    if (workspaceBlocks.length === 0) {
        alert("Workspace kosong! Tambahkan beberapa blok instruksi dahulu.");
        return;
    }

    synth.playClick();
    isExecuting = true;
    dom.runProgramBtn.classList.add('hidden');
    dom.stopProgramBtn.classList.remove('hidden');

    // Compile high-level blocks into sequential executing instructions
    executionQueue = compileWorkspace(workspaceBlocks);

    // Reset robot start position before simulation runs
    const lvl = LEVELS[currentLevel];
    robotPos = { ...lvl.start };

    // Clear path highlights
    const tiles = dom.gridContainer.querySelectorAll('.grid-tile');
    tiles.forEach(t => t.classList.remove('active-step'));

    let currentQueueIdx = 0;

    // Start Simulation Step Timer
    executionInterval = setInterval(() => {
        if (currentQueueIdx >= executionQueue.length) {
            // Program completed execution but didn't reach portal
            clearInterval(executionInterval);
            verifyMissionOutcome(true); // check if they are standing on goal
            return;
        }

        const cmd = executionQueue[currentQueueIdx];

        // Visual Highlight of active executing code block in workspace
        highlightBlockInWorkspace(cmd.blockId);

        // Execute single instruction
        const stepSucceeded = executeInstructionStep(cmd);

        if (!stepSucceeded) {
            // Robot crashed/failed
            clearInterval(executionInterval);
            showFailureModal("Robot menabrak dinding pembatas laboratorium! Coba analisis dan susun ulang baris kodemu.");
            return;
        }

        // Add highlight trail to tile
        const activeTile = dom.gridContainer.querySelector(`[data-x="${robotPos.x}"][data-y="${robotPos.y}"]`);
        if (activeTile) {
            activeTile.classList.add('active-step');
        }

        // Check immediate Portal Success
        const lvlGoal = LEVELS[currentLevel].goal;
        if (robotPos.x === lvlGoal.x && robotPos.y === lvlGoal.y) {
            clearInterval(executionInterval);
            showSuccessModal();
            return;
        }

        currentQueueIdx++;
    }, 600); // 600ms per step simulation speed
}

function stopProgram() {
    if (executionInterval) {
        clearInterval(executionInterval);
        executionInterval = null;
    }
    isExecuting = false;
    dom.runProgramBtn.classList.remove('hidden');
    dom.stopProgramBtn.classList.add('hidden');

    // Remove executing highlights
    const blocks = dom.workspaceBlocksStack.querySelectorAll('.block-item');
    blocks.forEach(b => b.classList.remove('executing-highlight'));
}

// Visual highlighting
function highlightBlockInWorkspace(blockId) {
    const blocks = dom.workspaceBlocksStack.querySelectorAll('.block-item');
    blocks.forEach(b => {
        if (b.id === blockId) {
            b.classList.add('executing-highlight');
        } else {
            b.classList.remove('executing-highlight');
        }
    });
}

/**
 * Converts nested blocks tree into linear queue of operations for the grid executor
 */
function compileWorkspace(blocksArr) {
    let queue = [];

    blocksArr.forEach(block => {
        if (block.type === 'move' || block.type === 'turn-left' || block.type === 'turn-right' || block.type === 'if-yellow' || block.type === 'if-purple') {
            queue.push({
                blockId: block.id,
                type: block.type
            });
        } else if (block.type === 'loop') {
            // Unroll loops! Repeat nested contents loopCount times
            for (let i = 0; i < block.loopCount; i++) {
                if (block.children && block.children.length > 0) {
                    block.children.forEach(child => {
                        queue.push({
                            blockId: child.id,
                            parentLoopId: block.id, // reference parent loop
                            type: child.type
                        });
                    });
                }
            }
        }
    });

    return queue;
}

/**
 * Mutates global robotPos state. Returns false if robot crashes
 */
function executeInstructionStep(cmd) {
    const lvl = LEVELS[currentLevel];

    // Check Conditional blocks trigger
    const onYellowTile = lvl.yellowTiles && lvl.yellowTiles.some(t => t.x === robotPos.x && t.y === robotPos.y);
    const onPurpleTile = lvl.purpleTiles && lvl.purpleTiles.some(t => t.x === robotPos.x && t.y === robotPos.y);

    if (cmd.type === 'if-yellow') {
        if (onYellowTile) {
            // Perform action: turn right
            turnRobot('RIGHT');
            synth.playMove();
            placeRobotElement();
        }
        return true;
    }

    if (cmd.type === 'if-purple') {
        if (onPurpleTile) {
            // Perform action: turn left
            turnRobot('LEFT');
            synth.playMove();
            placeRobotElement();
        }
        return true;
    }

    // Standard motion blocks
    if (cmd.type === 'move') {
        let newX = robotPos.x;
        let newY = robotPos.y;

        if (robotPos.dir === 'UP') newY--;
        if (robotPos.dir === 'RIGHT') newX++;
        if (robotPos.dir === 'DOWN') newY++;
        if (robotPos.dir === 'LEFT') newX--;

        // Collision validations
        if (newX < 0 || newX >= lvl.gridSize || newY < 0 || newY >= lvl.gridSize) {
            return false; // wall/boundary crash
        }

        const hitWall = lvl.walls.some(w => w.x === newX && w.y === newY);
        if (hitWall) {
            return false; // wall crash
        }

        // Apply motion
        robotPos.x = newX;
        robotPos.y = newY;
        synth.playMove();
        placeRobotElement();
        return true;
    }

    if (cmd.type === 'turn-left') {
        turnRobot('LEFT');
        synth.playMove();
        placeRobotElement();
        return true;
    }

    if (cmd.type === 'turn-right') {
        turnRobot('RIGHT');
        synth.playMove();
        placeRobotElement();
        return true;
    }

    return true;
}

function turnRobot(dirChange) {
    const directions = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
    let idx = directions.indexOf(robotPos.dir);

    if (dirChange === 'RIGHT') {
        idx = (idx + 1) % 4;
    } else {
        idx = (idx + 3) % 4; // same as -1
    }

    robotPos.dir = directions[idx];
}

function verifyMissionOutcome(outOfSteps = false) {
    const lvl = LEVELS[currentLevel];
    if (robotPos.x === lvl.goal.x && robotPos.y === lvl.goal.y) {
        showSuccessModal();
    } else {
        if (outOfSteps) {
            showFailureModal("Algoritma selesai dieksekusi, namun Albi si Robot belum sampai di portal tujuan. Coba rancang kembali rute langkahnya!");
        }
    }
}


/* ==========================================================================
   MODAL DIALOGS DISPLAY
   ========================================================================== */
function showSuccessModal() {
    stopProgram();
    synth.playSuccess();

    // Store level completion
    if (!completedLevels.includes(currentLevel)) {
        completedLevels.push(currentLevel);
        saveProgress();
    }

    const lvl = LEVELS[currentLevel];

    dom.successModalTitle.innerText = "Misi Berhasil Terpecahkan! 🎉";
    dom.successModalDesc.innerText = `Luar biasa! Kamu berhasil menuntaskan tantangan ini dalam ${countTotalBlocks(workspaceBlocks)} blok pemrograman.`;
    dom.successLearningInsight.querySelector('span').innerText = lvl.insight;

    if (currentLevel === 10) {
        dom.successNextBtn.innerText = "Ambil Sertifikat! 🏆";
    } else {
        dom.successNextBtn.innerText = "Misi Berikutnya →";
    }

    dom.successModal.classList.add('active');
}

function showFailureModal(message) {
    stopProgram();
    synth.playFailure();

    dom.failureModalTitle.innerText = "Aduh, Rute Bermasalah! 💥";
    dom.failureModalDesc.innerText = "Albi si Robot gagal mencapai koordinat portal.";
    dom.failureModalHint.innerText = message;

    dom.failureModal.classList.add('active');
}


/* ==========================================================================
   QUIZ ENGINE
   ========================================================================== */
function startQuiz() {
    quizIndex = 0;
    quizScore = 0;
    dom.nextQuestionBtn.classList.add('hidden');
    showScreen('quiz-page');
    loadQuizQuestion();
}

function loadQuizQuestion() {
    dom.nextQuestionBtn.classList.add('hidden');
    const qData = QUIZ_QUESTIONS[quizIndex];

    // Counter & progress bar
    dom.quizCounterText.innerText = `Pertanyaan ${quizIndex + 1} dari ${QUIZ_QUESTIONS.length}`;
    const progressPct = ((quizIndex) / QUIZ_QUESTIONS.length) * 100;
    dom.quizProgressFill.style.width = `${progressPct}%`;

    dom.quizQuestionText.innerText = qData.question;
    dom.quizOptionsContainer.innerHTML = '';

    qData.options.forEach((optText, oIdx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn glass-panel';
        btn.innerText = optText;

        btn.addEventListener('click', () => {
            selectQuizOption(btn, oIdx);
        });

        dom.quizOptionsContainer.appendChild(btn);
    });
}

function selectQuizOption(selectedBtn, optionIdx) {
    const qData = QUIZ_QUESTIONS[quizIndex];

    // Disable all options once an answer is chosen
    const allButtons = dom.quizOptionsContainer.querySelectorAll('.option-btn');
    allButtons.forEach(b => {
        b.style.pointerEvents = 'none';
    });

    if (optionIdx === qData.correct) {
        // Correct Answer
        selectedBtn.classList.add('correct-reveal');
        synth.playCorrect();
        quizScore++;
    } else {
        // Wrong Answer
        selectedBtn.classList.add('wrong-reveal');
        // Reveal correct answer in green
        allButtons[qData.correct].classList.add('correct-reveal');
        synth.playWrong();
    }

    dom.nextQuestionBtn.classList.remove('hidden');
}

function nextQuizQuestion() {
    quizIndex++;
    if (quizIndex < QUIZ_QUESTIONS.length) {
        loadQuizQuestion();
    } else {
        // Finish Quiz!
        finishQuiz();
    }
}

function finishQuiz() {
    synth.playSuccess();
    mazeQuizCompleted = true;
    saveProgress();

    // Update progress bar to 100%
    dom.quizProgressFill.style.width = `100%`;

    alert("Selamat! Kamu telah menyelesaikan Kuis Algoritma Mode Labirin (Maze)! Selesaikan juga Mode Teka-Teki (Puzzle) untuk membuka Sertifikat Kelulusan di Menu Utama.");
    showScreen('landing-page');
    updateCertificateCard();
}

/* ==========================================================================
   PUZZLE GAME MODE ENGINE
   ========================================================================== */
function loadPuzzleLevel(levelId) {
    currentPuzzleLevel = levelId;
    saveProgress();
    renderPuzzleLevelSelect();

    const lvl = PUZZLE_LEVELS[levelId];

    dom.puzzleLevelTitle.innerText = lvl.title;
    dom.puzzleLevelTag.innerText = lvl.concept;
    dom.puzzleLevelTag.className = 'level-concept-tag ' + (levelId === 3 ? 'cond' : (levelId === 4 ? 'loop' : (levelId === 5 ? 'debug' : 'seq')));
    dom.puzzleIntroText.innerText = lvl.instruction;
    dom.puzzleLevelCounter.innerText = `Teka-Teki ${levelId} dari ${Object.keys(PUZZLE_LEVELS).length}`;

    // Scramble/Shuffle the blocks
    puzzleBlocks = JSON.parse(JSON.stringify(lvl.blocks));
    do {
        puzzleBlocks.sort(() => Math.random() - 0.5);
    } while (isPuzzleAlreadyCorrect()); // make sure it's not already correct by accident

    renderPuzzleWorkspace();
    showScreen('puzzle-game-page');
}

function isPuzzleAlreadyCorrect() {
    for (let i = 0; i < puzzleBlocks.length; i++) {
        if (puzzleBlocks[i].correctOrder !== i) {
            return false;
        }
    }
    return true;
}

function renderPuzzleWorkspace() {
    dom.puzzleBlocksList.innerHTML = '';

    puzzleBlocks.forEach((block, idx) => {
        const item = document.createElement('div');
        item.className = 'puzzle-block-item block-item block-action';
        // Style based on content or level
        if (block.text.startsWith('  ')) {
            item.style.marginLeft = '20px';
        }

        item.innerHTML = `
            <span class="puzzle-block-label">${block.text}</span>
            <div class="puzzle-block-controls" onclick="event.stopPropagation()">
                <button class="btn-puzzle-control up-btn" title="Pindahkan Ke Atas" data-index="${idx}">▲</button>
                <button class="btn-puzzle-control down-btn" title="Pindahkan Ke Bawah" data-index="${idx}">▼</button>
            </div>
        `;

        // Add HTML5 Drag & Drop Support
        item.setAttribute('draggable', 'true');
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', idx);
            item.classList.add('block-dragging');
        });
        item.addEventListener('dragend', () => {
            item.classList.remove('block-dragging');
        });
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            const fromIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
            const toIdx = idx;
            if (fromIdx !== toIdx) {
                // Move item
                const moved = puzzleBlocks.splice(fromIdx, 1)[0];
                puzzleBlocks.splice(toIdx, 0, moved);
                synth.playClick();
                renderPuzzleWorkspace();
            }
        });

        // Add Click control handlers for Up/Down buttons
        const upBtn = item.querySelector('.up-btn');
        const downBtn = item.querySelector('.down-btn');

        upBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (idx > 0) {
                // Swap with previous
                const temp = puzzleBlocks[idx];
                puzzleBlocks[idx] = puzzleBlocks[idx - 1];
                puzzleBlocks[idx - 1] = temp;
                synth.playClick();
                renderPuzzleWorkspace();
            }
        });

        downBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (idx < puzzleBlocks.length - 1) {
                // Swap with next
                const temp = puzzleBlocks[idx];
                puzzleBlocks[idx] = puzzleBlocks[idx + 1];
                puzzleBlocks[idx + 1] = temp;
                synth.playClick();
                renderPuzzleWorkspace();
            }
        });

        dom.puzzleBlocksList.appendChild(item);
    });
}

function checkPuzzleSolution() {
    const isCorrect = isPuzzleAlreadyCorrect();

    if (isCorrect) {
        synth.playSuccess();
        // Add to completed
        if (!completedPuzzleLevels.includes(currentPuzzleLevel)) {
            completedPuzzleLevels.push(currentPuzzleLevel);
            saveProgress();
        }

        // Show Success Modal tailored for puzzle
        dom.successModalTitle.innerText = "Logika Algoritma Benar! 🎉";
        dom.successModalDesc.innerText = `Luar biasa! Kamu berhasil menyusun teka-teki logika ini secara runtut dan tepat.`;
        
        let insight = "Algoritma harus runtut agar dapat dipahami dan dijalankan komputer dengan benar.";
        if (currentPuzzleLevel === 3) insight = "Percabangan (If-Else) memungkinkan algoritma mengambil jalan berbeda tergantung pada kondisi luar.";
        if (currentPuzzleLevel === 4) insight = "Perulangan (Loop) menyederhanakan kode yang berjalan berulang kali agar lebih efisien.";
        dom.successLearningInsight.querySelector('span').innerText = insight;

        // Custom modal controls for Puzzle Mode
        dom.successRetryBtn.onclick = () => {
            dom.successModal.classList.remove('active');
            loadPuzzleLevel(currentPuzzleLevel);
        };
        
        dom.successNextBtn.onclick = () => {
            dom.successModal.classList.remove('active');
            if (currentPuzzleLevel < Object.keys(PUZZLE_LEVELS).length) {
                loadPuzzleLevel(currentPuzzleLevel + 1);
            } else {
                // Done all puzzle levels!
                alert("Selamat! Kamu menyelesaikan seluruh 10 Teka-Teki Logika Mode Puzzle!");
                showScreen('landing-page');
                updateCertificateCard();
            }
        };

        dom.successModal.classList.add('active');
    } else {
        synth.playWrong();
        dom.failureModalTitle.innerText = "Logikamu Belum Tepat! ❌";
        dom.failureModalDesc.innerText = "Robot Albi tidak bisa menjalankan urutan langkah ini.";
        dom.failureModalHint.innerText = "Periksa kembali logika urutan langkahmu. Apakah ada tindakan yang terbalik atau mendahului tindakan lain?";
        
        dom.failureCloseBtn.onclick = () => {
            dom.failureModal.classList.remove('active');
        };
        dom.failureModal.classList.add('active');
    }
}


function updateCertificateCard() {
    const totalPuzzles = Object.keys(PUZZLE_LEVELS).length;
    const mazeDone = completedLevels.length >= 10;
    const puzzleDone = completedPuzzleLevels.length >= totalPuzzles;
    const allDone = mazeDone && puzzleDone;

    if (allDone) {
        dom.modeCertBtn.classList.remove('locked');
        dom.modeCertBtn.classList.add('unlocked');
        dom.certLockLabel.innerText = mazeQuizCompleted ? '🏆 Klik untuk Lihat & Cetak Sertifikat!' : '🏆 Klik untuk Uji Kuis & Klaim Sertifikat!';
    } else {
        dom.modeCertBtn.classList.remove('unlocked');
        dom.modeCertBtn.classList.add('locked');

        let parts = [];
        if (!mazeDone) parts.push(`Maze ${completedLevels.length}/10`);
        if (!puzzleDone) parts.push(`Puzzle ${completedPuzzleLevels.length}/${totalPuzzles}`);

        dom.certLockLabel.innerText = `🔒 Belum Terbuka (${parts.join(' & ')})`;
    }
}


// Initialize application on load
window.addEventListener('DOMContentLoaded', () => {
    initApp();
});
