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
    
    button.prop('disabled', true).text('Memproses...');
    button.hide();
    wrapperElement.style.display = 'none';
    wrapperElement.offsetHeight;
    wrapperElement.style.display = '';
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(wrapperElement, {
      useCORS: true,
      backgroundColor: null
    });

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Gagal membuat blob'));
      }, 'image/jpeg');
    });

    await new Promise(resolve => setTimeout(resolve, 300));
    saveAs(blob, `patroli_${index + 1}_${waktuSekarang}.jpg`);
  } catch (err) {
    console.error(err);
    alert('Terjadi kesalahan: ' + err.message);
  } finally {
    button.show();
    button.prop('disabled', false).text('Download');
    overlay.remove();
  }
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

    $('#output-container').empty();
    $('#download-image').show();
    $('.upload-label').css('right', '50px')
    Array.from(files).forEach((file, index) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = function (event) {
        const img = new Image();
        img.src = event.target.result;
        img.style.maxWidth = '100%';
        img.style.display = 'block';

        const wrapper = $('<div class="image-wrapper" style="position:relative; margin-bottom:15px;"></div>');
        wrapper.attr('data-index', index).append(img);

        const downloadBtn = $(`
          <button class="per-image-download-btn" title="Download gambar ini"
            style="
              position: absolute;
              top: 10px;
              right: 10px;
              z-index: 10;
              background: darkgrey;
              color: black;
              border: none;
              border-radius: 5px;
              padding: 4px 8px;
              cursor: pointer;
              font-size: 12px;
            ">
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
      };

      reader.readAsDataURL(file);
    });
  });

  $('#apply-marki').on('click', function () {
    if (!currentWatermark) return alert('Tidak ada watermark yang dipilih.');
    const data = getFormData();
    updateMarkiBoxContent(currentWatermark, data);
    
    // 🔁 Samakan nama petugas di semua watermark
    $('.marki-box-clone .note-view').text(data.handler);
    $('.marki-box .note-view').text(data.handler); // jika watermark default juga ingin diubah
    
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
      myBtn.show();
   
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
      $box.find('.note-view').text(options.handler);
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
      location: $('#input-location').val() || 'Jalan Tanpa Nama',
      handler: $('#input-handler').val() || 'Petugas Patroli'
    };
  }

  function getIndonesianDayName(dateStr) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const date = new Date(dateStr);
    return isNaN(date) ? 'Hari' : days[date.getDay()];
  }
});