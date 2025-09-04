// =======================================================
// Utilitas Waktu & Hari
// =======================================================
const now = new Date();
const pad = n => n.toString().padStart(2, "0");

window.globalJam = pad(now.getHours());
window.globalMenit = pad(now.getMinutes());
window.globalTanggal = pad(now.getDate());
window.globalBulan = pad(now.getMonth() + 1);
window.globalTahun = now.getFullYear();

const hariIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
window.indonesiaDay = hariIndo[now.getDay()];

function getIndonesianDayName(dateStr) {
    const days = ["Minggu",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu"];
    const date = new Date(dateStr);
    return isNaN(date) ? "Hari": days[date.getDay()];
}

// =======================================================
// Variabel Global
// =======================================================
let currentWatermark = null;
let allWrappers = [];
let currentIndex = 0;

// =======================================================
// Overlay Spinner
// =======================================================
function createOverlay() {
    return $(`
        <div class="spinner-overlay">
        <div style="display: flex; flex-direction: column; align-items: center;">
        <div class="spinner"></div>
        <div class="spinner-text">0%</div>
        </div>
        </div>
        `);
}

// =======================================================
// Fungsi Download Gambar
// =======================================================
async function handleDownloadImage(wrapperElement, index, button) {
    const waktuSekarang = `${globalJam}-${globalMenit}-${globalTanggal}-${globalBulan}-${globalTahun}`;
    const overlay = createOverlay();

    let spinText;
    try {
        $("body").append(overlay);
        spinText = overlay.find(".spinner-text").text("Memproses...");
        button.hide();

        // Tunggu font
        if (document.fonts && document.fonts.ready) await document.fonts.ready;

        // Tunggu semua gambar
        const images = wrapperElement.querySelectorAll("img");
        await Promise.all(Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(res => {
                img.onload = res; img.onerror = res;
            });
        }));

        // Paksa reflow
        wrapperElement.style.display = "none";
        wrapperElement.offsetHeight;
        wrapperElement.style.display = "";
        await new Promise(r => setTimeout(r,
            100));

        // Render html2canvas
        const canvas = await html2canvas(wrapperElement, {
            useCORS: true,
            backgroundColor: null,
            scale: window.devicePixelRatio,
            logging: false,
            imageTimeout: 0,
            letterRendering: true
        });

        // Anti aliasing
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Ekspor
        const ext = wrapperElement.getAttribute("data-ext") || "jpg";
        const mimeType = ext === "png" ? "image/png": "image/jpeg";
        const fileExtension = ext === "png" ? "png": "jpg";

        const blob = await new Promise((resolve,
            reject) => {
            canvas.toBlob(b => b ? resolve(b): reject(new Error("Gagal membuat blob")),
                mimeType,
                1.0);
        });

        await new Promise(r => setTimeout(r,
            300));
        saveAs(blob, `patroli_${index + 1}_${waktuSekarang}.${fileExtension}`);

    } catch (err) {
        console.error(err);
        alert("Terjadi kesalahan: " + err.message);
    } finally {
        button.css("display", "inline-block");
        overlay.remove();
    }
}

// =======================================================
// Utilitas Format & Input
// =======================================================
function c2sc(isi) {
    const styleMap = {
        M: "c2scM",
        A: "c2sc marginC2sc",
        P: "c2sc c2scP marginC2sc",
        " ": "spasi"
    };
    return isi.replace(/[MAP ]/g, char => {
        const className = styleMap[char];
        return className === "spasi"
        ? "&nbsp;": `<span class="${className}">${char}</span>`;
    });
}

function getFormData() {
    return {
        time: $("#input-time").val() || "00:00",
        date: $("#input-date").val() || "2000-01-01",
        day: $("#input-day").val() || "Hari",
        location: c2sc($("#input-location").val()) || "Jalan Tanpa Nama",
        handler: c2sc($("#input-handler").val()) || c2sc("Petugas Patroli")
    };
}

// =======================================================
// Update & Extract Watermark
// =======================================================
function updateMarkiBoxContent($box, options = {}) {
    if (options.time) {
        const [jam,
            menit] = options.time.split(":");
        $box.find(".jam").text(jam);
        $box.find(".menit").text(menit);
    }
    if (options.date) {
        const [yyyy,
            mm,
            dd] = options.date.split("-");
        $box.find(".tanggal-ini").eq(0).text(`${dd}-${mm}-${yyyy}`);
    }
    if (options.day) {
        $box.find(".hari-ini").eq(0).html(c2sc(options.day));
    }
    if (options.location !== undefined) {
        $box.find(".location-view").html(options.location);
    }
    if (options.handler !== undefined) {
        $box.find(".note-view").html(options.handler);
    }
}

function extractWatermarkData($box) {
    const jam = $box.find(".jam").text();
    const menit = $box.find(".menit").text();

    const tanggalText = $box.find(".tanggal-ini").eq(0).text().trim();
    let date = "2000-01-01";
    if (tanggalText) {
        const parts = tanggalText.split("-"); // dd-mm-yyyy
        if (parts.length === 3) {
            const [dd,
                mm,
                yyyy] = parts;
            date = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
        }
    }

    return {
        time: `${jam}:${menit}`,
        date: date,
        day: $box.find(".hari-ini").text() || getIndonesianDayName(date),
        location: $box.find(".location-view").text(),
        handler: $box.find(".note-view").text()
    };
}
function updateIndicator() {
    $("#indicate1").html(`Foto ${currentIndex + 1} / ${allWrappers.length}`);
}
// =======================================================
// Navigasi Gambar
// =======================================================
function showImageAt(index, direction) {
    if (index < 0 || index >= allWrappers.length) return;
    const current = allWrappers[currentIndex];
    const next = allWrappers[index];

    if (current && current[0] !== next[0]) {
        current.removeClass("active show slide-in-left slide-in-right");
    }

    next.removeClass("slide-in-left slide-in-right show").addClass("active");

    if (direction === "left") {
        next.addClass("slide-in-left");
        requestAnimationFrame(() => next.removeClass("slide-in-left").addClass("show"));
    } else if (direction === "right") {
        next.addClass("slide-in-right");
        requestAnimationFrame(() => next.removeClass("slide-in-right").addClass("show"));
    } else {
        next.addClass("show");
    }

    currentIndex = index;
    updateIndicator(); // 🔥 update indikator
}
// =======================================================
// DOM Ready
// =======================================================
$(document).ready(function() {
    // Set default value input
    $("#input-date").val(`${globalTahun}-${pad(globalBulan)}-${pad(globalTanggal)}`);
    $("#input-time").val(`${pad(globalJam)}:${pad(globalMenit)}`);
    $("#input-day").val(indonesiaDay);

    // Ganti hari otomatis jika tanggal berubah
    $("#input-date").on("change", function () {
        $("#input-day").val(getIndonesianDayName($(this).val()));
    });

    // Toggle petugas
    $("#hidePetugas").on("change", function () {
        $(".handler-section").toggle(!$(this).is(":checked"));
    });
    
    $("#input-handler").on("change", function() {
        $('.note-view').html(c2sc($(this).val()))
    })

    // Upload Gambar
    $("#upload").on("change", function (e) {
        // Tombol navigasi
        $("#prev-btn").on("click", () => showImageAt(currentIndex - 1, "left"));
        $("#next-btn").on("click", () => showImageAt(currentIndex + 1, "right"));
        const files = Array.from(e.target.files).slice(0, 5); // 🔥 ambil maksimal 5
        if (!files.length) return;

        $("#output-container").empty();
        $("#download-image").show();
        allWrappers = [];
        currentIndex = 0;

        files.forEach((file, index) => {
            if (!file.type.startsWith("image/")) return;

            const reader = new FileReader();
            reader.onload = function (event) {
                const img = new Image();
                img.src = event.target.result;
                img.style.maxWidth = "100%";
                img.style.display = "block";

                const ext = file.name.split(".").pop().toLowerCase();
                const wrapper = $("<div class='image-wrapper'></div>")
                .attr("data-index", index)
                .attr("data-ext", ext)
                .append(img);

                // Tombol download
                const downloadBtn = $(`
                    <button class="per-image-download-btn btn btn-sm btn-success" title="Download gambar ini">
                    Download
                    </button>
                    `).on("click", function () {
                        handleDownloadImage(wrapper[0], index, $(this));
                    });
                wrapper.append(downloadBtn);

                // Watermark clone
                const watermark = $(".marki-box").clone()
                .removeAttr("id")
                .addClass("marki-box-clone")
                .css({
                    position: "absolute", bottom: "15px", left: "15px", zIndex: 5, cursor: "pointer"
                });

                updateMarkiBoxContent(watermark, {
                    date: `${globalTahun}-${pad(globalBulan)}-${pad(globalTanggal)}`,
                    time: `${pad(globalJam)}:${pad(globalMenit)}`,
                    day: indonesiaDay
                });

                watermark.on("click", function () {
                    currentWatermark = $(this);
                    $("#popup-edit").removeClass("rmin").addClass("rbase");
                });

                wrapper.append(watermark);
                $("#output-container").append(wrapper);
                allWrappers.push(wrapper);
            };
            reader.readAsDataURL(file);
        });

        setTimeout(() => {
            showImageAt(0);
        },
            300);

        $("#output-upload").show();
        $("#nav-bottom").addClass("top-0");
    });
    // Tombol cancel popup
    $("#cancel-button").on("click", function () {
        $("#popup-edit").removeClass("rbase").addClass("rmin");
    });

    // Apply watermark
    $("#apply-marki").on("click", function () {
        if (!currentWatermark) return alert("Tidak ada watermark yang dipilih.");
        const data = getFormData();
        updateMarkiBoxContent(currentWatermark, data);

        // Hapus cap air lama
        currentWatermark.siblings(".cap-air").remove();

        // Tambah cap air jika dicentang
        if ($("#toggle-cap-air").is(":checked")) {
            const capAirImg = $('<img class="cap-air" src="img/cap-air(1).png" alt="Cap Air">')
            .css({
                position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: "95%", zIndex: 6, pointerEvents: "none"
            });
            currentWatermark.parent().append(capAirImg);
        }

        $("#popup-edit").removeClass("rbase").addClass("rmin");
        currentWatermark = null;
    });
});

// =======================================================
// Debug Overflow
// =======================================================
document.addEventListener("DOMContentLoaded", function() {
    const docWidth = document.documentElement.offsetWidth;
    document.querySelectorAll("*").forEach(function(el) {
        let selector = el.tagName.toLowerCase();
        if (el.id) selector += "#" + el.id;
        if (el.className) selector += "." + el.className.toString().replace(/\s+/g, ".");
        if (el.offsetWidth > 427) {
            console.warn("X:", selector, "=>", el.offsetWidth, "px >", 427, "px");
        }
    });
});