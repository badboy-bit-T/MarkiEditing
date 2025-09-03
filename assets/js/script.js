// Buat tanggal sekarang
const now = new Date();

// Helper function untuk 2 digit
const pad = n => n.toString().padStart(2, '0');
// Variabel global
window.globalJam = pad(now.getHours());
window.globalMenit = pad(now.getMinutes());
window.globalTanggal = pad(now.getDate());
window.globalBulan = pad(now.getMonth() + 1); // Januari = 0
window.globalTahun = now.getFullYear();

// Nama hari dalam bahasa Indonesia
const hariIndo = [
    "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
];
window.indonesiaDay = hariIndo[now.getDay()];

// Cek hasil
console.log(globalJam, globalMenit, globalTanggal, globalBulan, globalTahun, indonesiaDay);

let currentWatermark = null;
let allWrappers = [];
let currentIndex = 0;


const hh = globalJam;
const mm = globalMenit;
const yyyy = globalTahun;
const mmNum = globalBulan
const dd = globalTanggal;

const dateStr = `${yyyy}-${mmNum}-${dd}`;
const timeStr = `${hh}:${mm}`;
const waktuSekarang = `${hh}-${mm}-${dateStr}`;
function getIndonesianDayName(dateStr) {
    const days = ['Minggu',
        'Senin',
        'Selasa',
        'Rabu',
        'Kamis',
        'Jumat',
        'Sabtu'];
    const date = new Date(dateStr);
    return isNaN(date) ? 'Hari': days[date.getDay()];
}
const overlay = $(`
    <div class="spinner-overlay">
    <div style="display: flex; flex-direction: column; align-items: center;">
    <div class="spinner"></div>
    <div class="spinner-text">0%</div>
    </div>
    </div>
    `);

async function handleDownloadImage(wrapperElement, index, button) {
    const now = new Date();

    // Pakai variabel global supaya konsisten
    const waktuSekarang = `${globalJam}-${globalMenit}-${globalTanggal}-${globalBulan}-${globalTahun}`;

    let spinText;
    try {
        $("body").append(overlay);
        spinText = overlay.find('.spinner-text');
        spinText.text("Memproses...");

        button.css('display', 'none');

        // 🔹 1. Pastikan semua font sudah siap
        if (document.fonts && document.fonts.ready) {
            await document.fonts.ready;
        }

        // 🔹 2. Pastikan semua gambar di dalam wrapperElement sudah ter-load
        const images = wrapperElement.querySelectorAll('img');
        await Promise.all(Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(res => {
                img.onload = res;
                img.onerror = res;
            });
        }));

        // 🔹 3. Paksa reflow CSS sebelum render
        wrapperElement.style.display = 'none';
        wrapperElement.offsetHeight; // trigger reflow
        wrapperElement.style.display = '';
        await new Promise(resolve => setTimeout(resolve,
            100));

        // 🔹 4. Render dengan html2canvas
        const canvas = await html2canvas(wrapperElement, {
            useCORS: true,
            backgroundColor: null,
            scale: window.devicePixelRatio, // resolusi tajam
            logging: false,
            imageTimeout: 0,
            letterRendering: true
        });

        // 🔹 5. Terapkan anti-aliasing extra di hasil canvas
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 🔹 6. Ekspor file
        const ext = wrapperElement.getAttribute('data-ext') || 'jpg';
        const mimeType = ext === 'png' ? 'image/png': 'image/jpeg';
        const fileExtension = ext === 'png' ? 'png': 'jpg';

        const blob = await new Promise((resolve,
            reject) => {
            canvas.toBlob(blob => blob ? resolve(blob): reject(new Error('Gagal membuat blob')),
                mimeType,
                1.0);
        });

        await new Promise(resolve => setTimeout(resolve,
            300));

        saveAs(blob, `patroli_${index + 1}_${waktuSekarang}.${fileExtension}`);

    } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan: ' + err.message);
    } finally {
        button.show();
        button.css('display', 'inline-block');
        overlay.remove();
    }
}

function c2sc(isi) {
    const styleMap = {
        M: 'c2scM',
        A: 'c2sc marginC2sc',
        P: 'c2sc c2scP marginC2sc',
        ' ': 'spasi'
    };

    return isi.replace(/[MAP ]/g, char => {
        const className = styleMap[char];
        if (className === 'spasi') {
            return `&nbsp;`;
        }
        return `<span class="${className}">${char}</span>`;
    });
}

    function getFormData() {
        return {
            time: $('#input-time').val() || '00:00',
            date: $('#input-date').val() || '2000-01-01',
            day: $('#input-day').val() || 'Hari',
            location: c2sc($('#input-location').val()) || 'Jalan Tanpa Nama',
            handler: c2sc($('#input-handler').val())|| c2sc('Petugas Patroli')
        };
    }


function updateMarkiBoxContent($box, options = {}) {
    if (options.time) {
        const [jam,
            menit] = options.time.split(':');
        $box.find('.jam').text(jam);
        $box.find('.menit').text(menit);
    }

    if (options.date) {
        const [yyyy,
            mm,
            dd] = options.date.split('-');
        $box.find('.tanggal-ini').eq(0).text(`${dd}-${mm}-${yyyy}`);
    }

    if (options.day) {
        $box.find('.hari-ini').eq(0).html(c2sc(options.day));
    }

    if (options.location !== undefined) {
        $box.find('.location-view').html(options.location);
    }

    if (options.handler !== undefined) {
        $box.find('.note-view').html(options.handler);
    }
}

function extractWatermarkData($box) {
    const jam = $box.find('.jam').text();
    const menit = $box.find('.menit').text();
    const [dd,
        mm,
        yyyy] = $box.find('.column.small-text .tanggal-ini').eq(0).text().split('-');
    const date = `${yyyy}-${mm}-${dd}`;
    return {
        time: `${jam}:${menit}`,
        date: date,
        day: getIndonesianDayName(date),
        location: $box.find('.location-view').text(),
        handler: $box.find('.note-view').text()
    };
}

function extractWatermarkData($box) {
    const jam = $box.find('.jam').text();
    const menit = $box.find('.menit').text();

    // ambil tanggal dari element
    const tanggalText = $box.find('.tanggal-ini').eq(0).text().trim();
    let date = "2000-01-01";
    if (tanggalText) {
        const parts = tanggalText.split('-'); // dd-mm-yyyy
        if (parts.length === 3) {
            const [dd,
                mm,
                yyyy] = parts;
            date = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        }
    }

    return {
        time: `${jam}:${menit}`,
        date: date,
        day: $box.find('.hari-ini').text() || getIndonesianDayName(date),
        location: $box.find('.location-view').text(),
        handler: $box.find('.note-view').text()
    };
}

function showImageAt(index, direction) {
    if (index < 0 || index >= allWrappers.length) return;
    const current = allWrappers[currentIndex];
    const next = allWrappers[index];

    if (current && current[0] !== next[0]) {
        current.removeClass('active show slide-in-left slide-in-right');
    }

    next.removeClass('slide-in-left slide-in-right show').addClass('active');

    if (direction === 'left') {
        next.addClass('slide-in-left');
        requestAnimationFrame(() => {
            next.removeClass('slide-in-left').addClass('show');
        });
    } else if (direction === 'right') {
        next.addClass('slide-in-right');
        requestAnimationFrame(() => {
            next.removeClass('slide-in-right').addClass('show');
        });
    } else {
        next.addClass('show');
    }

    currentIndex = index;
}



$(document).ready(function() {
    $('#input-date').val(globalTahun+'-'+globalBulan+'-'+globalTanggal); $('#input-time').val(globalJam+':'+globalMenit); $('#input-day').val(indonesiaDay)

    const $defaultBox = $('.marki-box');


    $('#input-date').on('change', function () {
        $('#input-day').val(getIndonesianDayName($(this).val()));
    });

    $('#hidePetugas').on('change', function () {
        $('.handler-section').toggle(!$(this).is(':checked'));
    });
    $('#upload').on('change', function (e) {
        const files = e.target.files;
        if (!files.length) return;
        $('#output-container').empty();
        $('#download-image').show();
        allWrappers = [];
        currentIndex = 0;

        Array.from(files).forEach((file, index) => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = function (event) {
                const img = new Image();
                img.src = event.target.result;
                img.style.maxWidth = '100%';
                img.style.display = 'block';

                const ext = file.name.split('.').pop().toLowerCase();
                const wrapper = $('<div class="image-wrapper"></div>')
                .attr('data-index', index)
                .attr('data-ext', ext)
                .append(img);

                const downloadBtn = $(`
                    <button to"#tools" class="per-image-download-btn" title="Download gambar ini"
                    style="position: absolute; top: 10px; right: 10px; z-index: 10;
                    background: darkgrey; color: black; border: none;
                    border-radius: 5px; padding: 4px 8px; cursor: pointer; font-size: 12px;">
                    Download
                    </button>
                    `);

                downloadBtn.on('click', function () {
                    handleDownloadImage(wrapper[0], index, $(this));
                });
                wrapper.append(downloadBtn);

                const watermark = $('.marki-box').clone().attr('id', 'marki-box-clone').attr("to", "#tools").addClass('marki-box-clone');

                watermark.css({
                    position: 'absolute',
                    bottom: '15px',
                    left: '15px',
                    zIndex: 5,
                    cursor: 'pointer'
                });

                updateMarkiBoxContent(watermark, {
                    date: dateStr, time: timeStr, day: indonesiaDay
                });

                watermark.on('click', function () {
                    currentWatermark = $(this); // ambil watermark yang diklik
                    const currentData = extractWatermarkData(currentWatermark);
                    $('#input-time').val(currentData.time);
                    $('#input-date').val(currentData.date);
                    $('#input-day').val(currentData.day);
                    $('#input-location').val(currentData.location);
                    $('#input-handler').val(currentData.handler);
                    $('#popup-edit').toggleClass('rmin rbase');
                });
                wrapper.append(watermark);
                $('#output-container').append(wrapper);
                allWrappers.push(wrapper);
            };

            reader.readAsDataURL(file);
        });

        setTimeout(() => {
            showImageAt(0);
        },300);
        $("#tools-ukuran").show()

    });
    $("#cancel-button").on("click", function () {
        $('#popup-edit').toggleClass('rmin').toggleClass('rbase')
    })
    $('#apply-marki').on('click', function () {
        if (!currentWatermark) return alert('Tidak ada watermark yang dipilih.');
        const data = getFormData();

        updateMarkiBoxContent(currentWatermark, data);

        // Hapus overlay lama
        currentWatermark.siblings('.cap-air').remove();

        // Tambahkan overlay jika dicentang
        if ($('#toggle-cap-air').is(':checked')) {
            const capAirImg = $('<img class="cap-air" src="img/cap-air(1).png" alt="Cap Air">');
            capAirImg.css({
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 6,
                pointerEvents: 'none'
            });
            currentWatermark.parent().append(capAirImg);
        }

        $('#popup-edit').toggleClass('rmin rbase');
        currentWatermark = null;
    });
})


document.addEventListener("DOMContentLoaded", function() {
    const docWidth = document.documentElement.offsetWidth;
    const docHeight = document.documentElement.offsetHeight;

    document.querySelectorAll("*").forEach(function(el) {
        console.log('doc: '+docWidth)
        let selector = el.tagName.toLowerCase();
        if (el.id) selector += "#" + el.id;
        if (el.className) selector += "." + el.className.toString().replace(/\s+/g, ".");

        if (el.offsetWidth > 427) {
            console.warn("X:", selector, "=>", el.offsetWidth, "px", ">", 427, "px");
        }
    });
});