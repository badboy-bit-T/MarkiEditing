const popupFormEditMark = $('#popup');
let currentWatermark = null;

const pad = n => n.toString().padStart(2, '0');

function getCurrentTimestamp() {
  const now = new Date();
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const dd = pad(now.getDate());
  const mmNum = pad(now.getMonth() + 1);
  const yyyy = now.getFullYear();
  return `${hh}-${mm}-${dd}-${mmNum}-${yyyy}`;
}

const overlay = $(`
  <div class="spinner-overlay">
    <div style="display: flex; flex-direction: column; align-items: center;">
      <div class="spinner"></div>
      <div class="spinner-text">Memproses...</div>
    </div>
  </div>
`);

async function handleDownloadImage(wrapperElement, waktuSekarang) {
  try {
    $("body").append(overlay);
    const spinText = overlay.find('.spinner-text');
    spinText.text("Memproses...");

    wrapperElement.style.display = 'none';
    wrapperElement.offsetHeight;
    wrapperElement.style.display = '';
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(wrapperElement, {
      useCORS: true,
      backgroundColor: null // mempertahankan transparansi PNG
    });

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Gagal membuat blob')), 'image/png');
    });

    await new Promise(resolve => setTimeout(resolve, 300));
    saveAs(blob, `patroli_${waktuSekarang}.png`);
  } catch (err) {
    console.error(err);
    alert('Terjadi kesalahan: ' + err.message);
  } finally {
    overlay.remove();
  }
}

$(document).ready(function () {
  const now = new Date();
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const yyyy = now.getFullYear();
  const mmNum = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());

  const dateStr = `${yyyy}-${mmNum}-${dd}`;
  const timeStr = `${hh}:${mm}`;
  const waktuSekarang = getCurrentTimestamp();
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
function loadDefaultImage() {
  const defaultImageSrc = 'img/transparent.png';
  const img = new Image();
  img.src = defaultImageSrc;
  img.style.maxWidth = '100%';
  img.style.display = 'block';

  const wrapper = $('<div class="image-wrapper" style="position:relative; margin-bottom:15px;"></div>');
  wrapper.append(img);

  const watermark = $('.marki-box').clone().removeAttr('id').addClass('marki-box-clone');
  watermark.css({
    position: 'absolute',
    bottom: '15px',
    left: '15px',
    zIndex: 5,
    cursor: 'pointer'
  });

  const now = new Date();
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const yyyy = now.getFullYear();
  const mmNum = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());

  const dateStr = `${yyyy}-${mmNum}-${dd}`;
  const timeStr = `${hh}:${mm}`;
  const dayName = getIndonesianDayName(dateStr);

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

  $('#download-image').show();
  $('#animatedText').hide();
  $('.upload-label').css('right', '50px');
}
loadDefaultImage();
  $('#upload').on('change', function (e) {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    $('#animatedText').hide();
    $('#output-container').empty();
    $('#download-image').show();
    $('.upload-label').css('right', '50px');

    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.src = event.target.result;
      img.style.maxWidth = '100%';
      img.style.display = 'block';

      const wrapper = $('<div class="image-wrapper" style="position:relative; margin-bottom:15px;"></div>');
      wrapper.append(img);

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

  $('#apply-marki').on('click', function () {
    if (!currentWatermark) return alert('Tidak ada watermark yang dipilih.');
    const data = getFormData();
    updateMarkiBoxContent(currentWatermark, data);

    $('.marki-box-clone .note-view').text(data.handler);
    $('.marki-box .note-view').text(data.handler);

    popupFormEditMark.hide();
    currentWatermark = null;
  });

  $('#cancel-button').on('click', function () {
    popupFormEditMark.hide();
    currentWatermark = null;
  });

  $('#download-image').on('click', async function () {
    const wrapper = $('#output-container .image-wrapper')[0];
    if (wrapper) {
      await handleDownloadImage(wrapper, waktuSekarang);
    } else {
      alert('Tidak ada gambar untuk diunduh.');
    }
  });

  // Helper Functions
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