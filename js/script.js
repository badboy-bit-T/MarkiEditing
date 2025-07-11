$(document).ready(function () {
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
  const dayName = getIndonesianDayName(dateStr);

  // ⏱️ Set default nilai pada popup form
  $('#input-date').val(dateStr);
  $('#input-time').val(timeStr);
  $('#input-day').val(dayName);

  // ⏱️ Set default watermark utama (template)
  const $defaultBox = $('.marki-box');
  updateMarkiBoxContent($defaultBox, {
    time: timeStr,
    date: dateStr,
    day: dayName
  });

  $('#input-date').on('change', function () {
    const selectedDate = $(this).val();
    $('#input-day').val(getIndonesianDayName(selectedDate));
  });

  $('#hidePetugas').on('change', function () {
    const isChecked = $(this).val() === 'checked';
    if (isChecked) {
      $(this).val('uncheck');
      $('.handler-section').show();
    } else {
      $(this).val('checked');
      $('.handler-section').hide();
    }
  });

  $('#upload').on('change', function (e) {
    const files = e.target.files;
    if (!files.length) return;

    $('#output-container').html('');

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

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

        updateMarkiBoxContent(watermark, {
          date: dateStr,
          time: timeStr,
          day: dayName
        });

        watermark.on('click', function () {
          currentWatermark = $(this);
          const currentData = extractWatermarkData(currentWatermark);
          $('#input-time').val(currentData.time);
          $('#input-date').val(currentData.date);
          $('#input-day').val(currentData.day);
          $('#input-location').val(currentData.location);
          $('#input-handler').val(currentData.handler);
          $('#popup').css('display', 'flex');
        });

        wrapper.append(watermark);
        $('#output-container').append(wrapper);
        $('#download-image').show();
      };
      reader.readAsDataURL(file);
    });
  });

  $('#apply-marki').click(function () {
    if (!currentWatermark) return alert('Tidak ada watermark yang dipilih.');
    updateMarkiBoxContent(currentWatermark, getFormData());
    $('#popup').hide();
    currentWatermark = null;
  });

  $('#cancel-button').click(function () {
    $('#popup').hide();
    currentWatermark = null;
  });

  // ✅ Download ZIP berisi semua gambar
  $('#download-image').click(async function () {
    const zip = new JSZip();
    const folder = zip.folder("patroli_images");

    const wrappers = $('.image-wrapper').toArray();

    for (let i = 0; i < wrappers.length; i++) {
      const canvas = await html2canvas(wrappers[i]);
      const dataUrl = canvas.toDataURL('image/png');
      const imgData = dataUrl.split(',')[1];
      folder.file(`patroli_${i + 1}.png`, imgData, { base64: true });
    }

    zip.generateAsync({ type: 'blob' }).then(function (content) {
      saveAs(content, "patroli_foto.zip");
    });
  });

  function updateMarkiBoxContent($box, options = {}) {
    if (options.time) {
      const [hh, mm] = options.time.split(':');
      $box.find('.jam').text(hh);
      $box.find('.menit').text(mm);
    }

    if (options.date) {
      const [yyyy, mm, dd] = options.date.split('-');
      const tglFormat = `${dd}-${mm}-${yyyy}`;
      $box.find('.column.small-text div').eq(0).text(tglFormat);
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
    const dateText = $box.find('.column.small-text div').eq(0).text();
    const [dd, mm, yyyy] = dateText.split('-');
    const date = `${yyyy}-${mm}-${dd}`;
    const day = $box.find('.column.small-text div').eq(1).text();
    const location = $box.find('.location-view').text();
    const handler = $box.find('.note-view').text();

    return {
      time: `${jam}:${menit}`,
      date,
      day,
      location,
      handler
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
    return days[date.getDay()];
  }
});