const popupFormEditMark = $('#popup');
let currentWatermark = null;
let allWrappers = [];
let currentIndex = 0;

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

async function handleDownloadImage(wrapperElement, index, button) {
    const now = new Date();
    const waktuSekarang = `${pad(now.getHours())}-${pad(now.getMinutes())}-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

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
        wrapperElement.offsetHeight; // reflow
        wrapperElement.style.display = '';
        await new Promise(resolve => setTimeout(resolve, 100));

        // 🔹 4. Render dengan html2canvas + anti-aliasing
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
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
        const fileExtension = ext === 'png' ? 'png' : 'jpg';

        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Gagal membuat blob')), mimeType, 1.0);
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

$(document).ready(function () {
    $('.link-instruksi').on('click', function(){
        alert("diklik"+$(this).attr('target'))
    })
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
                  <button class="per-image-download-btn" title="Download gambar ini"  
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
                allWrappers.push(wrapper);
            };  

            reader.readAsDataURL(file);  
        });

        setTimeout(() => {
            showImageAt(0);
            addNavigationButtons();
        }, 300);
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
            handler: c2sc($('#input-handler').val())|| c2sc('Petugas Patroli')
        };
    }

    function getIndonesianDayName(dateStr) {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const date = new Date(dateStr);
        return isNaN(date) ? 'Hari' : days[date.getDay()];
    }

    // Navigasi antar gambar
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

    function addNavigationButtons() {
        if ($('#prev-btn').length === 0) {
            const prevBtn = $('<button id="prev-btn" class="nav-btn left">&#9664;</button>');
            const nextBtn = $('<button id="next-btn" class="nav-btn right">&#9654;</button>');

            prevBtn.on('click', () => {
                const newIndex = (currentIndex - 1 + allWrappers.length) % allWrappers.length;
                showImageAt(newIndex, 'left');
            });

            nextBtn.on('click', () => {
                const newIndex = (currentIndex + 1) % allWrappers.length;
                showImageAt(newIndex, 'right');
            });

            $('#output-container').append(prevBtn, nextBtn);
        }
    }
          $("#openPopupInstruksi").click(function(){
        $("#popupOverlayInstruksi").fadeIn(300);
                  $('.navbar-bottom, .upload-label, #download-image').hide();
      });

      $("#closePopupInstruksi").click(function(){
        $("#popupOverlayInstruksi").fadeOut(300);
                  $('.navbar-bottom, .upload-label, #download-image').show();
      });

      // Tutup popup jika klik di luar popup-box
      $(window).click(function(e){
        if($(e.target).is("#popupOverlayInstruksi")){
          $("#popupOverlayInstruksi").fadeOut(300);
          $('.navbar-bottom, .upload-label, #download-image').show();
        } 
      });
});
