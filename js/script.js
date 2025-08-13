const popupFormEditMark = $('#popup');
let currentWatermark = null;

const pad = n => n.toString().padStart(2, '0');

const now = new Date();
const hh = pad(now.getHours());
const mm = pad(now.getMinutes());
const yyyy = now.getFullYear();
const mmNum = pad(now.getMonth() + 1);
const dd = pad(now.getDate());

const dateStr = `${yyyy}-${mmNum}-${dd}`;
const timeStr = `${hh}:${mm}`;
const waktuSekarang = `${hh}-${mm}-${dateStr}`;

const overlay = $(`
  <div class="spinner-overlay">  
    <div style="display: flex; flex-direction: column; align-items: center;">  
      <div class="spinner"></div>  
      <div class="spinner-text">0%</div>  
    </div>  
  </div>  
`);  

async function handleDownloadImage(wrapperElement, index, button, waktuSekarang) {
    let spinText;
    try {
        $("body").append(overlay);
        spinText = overlay.find('.spinner-text');
        spinText.text("Memproses...");

        button.css('display', 'none');  

        wrapperElement.style.display = 'none';  
        wrapperElement.offsetHeight;  
        wrapperElement.style.display = '';  
        await new Promise(resolve => setTimeout(resolve, 100));  

        const canvas = await html2canvas(wrapperElement, {  
            useCORS: true,  
            backgroundColor: null  
        });  

        const ext = wrapperElement.getAttribute('data-ext') || 'jpg';  
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';  
        const fileExtension = ext === 'png' ? 'png' : 'jpg';  

        const blob = await new Promise((resolve, reject) => {  
            canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Gagal membuat blob')), mimeType);  
        });  

        await new Promise(resolve => setTimeout(resolve, 300));  
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

function c2sc(gerak) {
    return gerak.replace(/[MAP]/g, match => `<span class="c2sc">${match}</span>`);
}

$(document).ready(function () {

    const dayName = getIndonesianDayName(dateStr);
    $('#input-date').val(dateStr);
    $('#input-time').val(timeStr);
    $('#input-day').val(dayName);

    const $defaultBox = $('.marki-box');
    updateMarkiBoxContent($defaultBox, { time: timeStr, date: dateStr, day: dayName });

    $('#input-date').on('change', function () {
        $('#input-day').val(getIndonesianDayName($(this).val()));
    });

    $('#hidePetugas').on('change', function () {
        $('.handler-section').toggle(!$(this).is(':checked'));
    });

    $('#upload').on('change', function (e) {
        const files = e.target.files;
        if (!files.length) return;
        $('#animatedText').hide();
        $('#output-container').empty();
        $('#download-image').show();
        $('.upload-label').css('right', '50px');

        Array.from(files).forEach((file, index) => {  
            if (!file.type.startsWith('image/')) return;  

            const reader = new FileReader();  
            reader.onload = function (event) {  
                const img = new Image();  
                img.src = event.target.result;  
                img.style.maxWidth = '100%';  
                img.style.display = 'block';  

                const ext = file.name.split('.').pop().toLowerCase();  
                const wrapper = $('<div class="image-wrapper" style="position:relative; margin-bottom:15px;"></div>');  
                wrapper.attr('data-index', index).attr('data-ext', ext).append(img);  

                const downloadBtn = $(`  
                  <button class="per-image-download-btn" title="Download gambar ini"  
                    style="position: absolute; top: 10px; right: 10px; z-index: 10;  
                           background: darkgrey; color: black; border: none;  
                           border-radius: 5px; padding: 4px 8px; cursor: pointer; font-size: 12px;">  
                    Download  
                  </button>  
                `);  

                downloadBtn.on('click', function () {  
                    handleDownloadImage(wrapper[0], index, $(this), waktuSekarang);  
                });  
                wrapper.append(downloadBtn);  

                const watermark = $('.marki-box').clone().removeAttr('id').addClass('marki-box-clone');  
                watermark.css({  
                    position: 'absolute',  
                    bottom: '15px',  
                    left: '15px',  
                    zIndex: 5,  
                    cursor: 'pointer'  
                });  

                updateMarkiBoxContent(watermark, { date: dateStr, time: timeStr, day: dayName });  

                watermark.on('click', function () {  
                    currentWatermark = $(this);  
                    const currentData = extractWatermarkData(currentWatermark);  
                    $('#input-time').val(currentData.time);  
                    $('#input-date').val(currentData.date);  
                    $('#input-day').val(currentData.day);  
                    $('#input-location').val(currentData.location);  
                    $('#input-handler').val(currentData.handler);  
                    popupFormEditMark.css('display', 'flex');  
                });  

                wrapper.append(watermark);  
                $('#output-container').append(wrapper);  

                const slider = document.getElementById('output-container');  
                let isDown = false;  
                let startX;  
                let scrollLeft;  
                  
                // Drag pakai mouse  
                slider.addEventListener('mousedown', (e) => {  
                    isDown = true;  
                    startX = e.pageX - slider.offsetLeft;  
                    scrollLeft = slider.scrollLeft;  
                    slider.style.cursor = 'grabbing';  
                });  
                  
                slider.addEventListener('mouseleave', () => {  
                    isDown = false;  
                    slider.style.cursor = 'grab';  
                });  
                  
                slider.addEventListener('mouseup', () => {  
                    isDown = false;  
                    slider.style.cursor = 'grab';  
                });  
                  
                slider.addEventListener('mousemove', (e) => {  
                    if (!isDown) return;  
                    e.preventDefault();  
                    const x = e.pageX - slider.offsetLeft;  
                    const walk = (x - startX) * 1; // kecepatan scroll  
                    slider.scrollLeft = scrollLeft - walk;  
                });  
                  
                // Swipe pakai touch  
                let touchStartX = 0;  
                let touchScrollLeft = 0;  
                  
                slider.addEventListener('touchstart', (e) => {  
                    touchStartX = e.touches[0].pageX;  
                    touchScrollLeft = slider.scrollLeft;  
                }, { passive: true });  
                  
                slider.addEventListener('touchmove', (e) => {  
                    const touchX = e.touches[0].pageX;  
                    const walk = (touchX - touchStartX) * 1;  
                    slider.scrollLeft = touchScrollLeft - walk;  
                }, { passive: true });  
            };  

            reader.readAsDataURL(file);  
        });
    });

    $('#apply-marki').on('click', function () {
        if (!currentWatermark) return alert('Tidak ada watermark yang dipilih.');
        const data = getFormData();
        updateMarkiBoxContent(currentWatermark, data);

        $('.marki-box-clone .note-view').html(data.handler);  
        $('.marki-box .note-view').html(data.handler);  
        $('.marki-box-clone .location-view').html(data.location);  
        $('.marki-box .location-view').html(data.location);  

        popupFormEditMark.hide();  
        currentWatermark = null;
    });

    $('#cancel-button').on('click', function () {
        popupFormEditMark.hide();
        currentWatermark = null;
    });

    $('#download-image').on('click', async function () {
        $("body").append(overlay);
        const myBtn = $('.per-image-download-btn');

        for (let i = 0; i < myBtn.length; i++) {  
            try {  
                myBtn[i].click();  
            } catch (e) {  
                console.error(`Gagal memproses gambar ke-${i + 1}:`, e);  
            }  
        }
    });

    function updateMarkiBoxContent($box, options = {}) {
        if (options.time) {
            const [jam, menit] = options.time.split(':');
            $box.find('.jam').text(jam);
            $box.find('.menit').text(menit);
        }

        if (options.date) {  
            const [yyyy, mm, dd] = options.date.split('-');  
            $box.find('.column.small-text div').eq(0).text(`${dd}-${mm}-${yyyy}`);  
        }  

        if (options.day) {  
            $box.find('.column.small-text div').eq(1).text(options.day);  
        }  

        if (options.location !== undefined) {  
            $box.find('.location-view').text(options.location);  
        }  

        if (options.handler !== undefined) {  
            $box.find('.note-view').html(options.handler);  
        }
    }

    function extractWatermarkData($box) {
        const jam = $box.find('.jam').text();
        const menit = $box.find('.menit').text();
        const [dd, mm, yyyy] = $box.find('.column.small-text div').eq(0).text().split('-');
        const date = `${yyyy}-${mm}-${dd}`;
        return {
            time: `${jam}:${menit}`,
            date,
            day: $box.find('.column.small-text div').eq(1).text(),
            location: $box.find('.location-view').text(),
            handler: $box.find('.note-view').text()
        };
    }

    function getFormData() {
        return {
            time: $('#input-time').val() || '00:00',
            date: $('#input-date').val() || '2000-01-01',
            day: $('#input-day').val() || 'Hari',
            location: c2sc($('#input-location').val()) || 'Jalan Tanpa Nama',
            handler: c2sc($('#input-handler').val()) || c2sc('Petugas Patroli')
        };
    }

    function getIndonesianDayName(dateStr) {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const date = new Date(dateStr);
        return isNaN(date) ? 'Hari' : days[date.getDay()];
    }
});