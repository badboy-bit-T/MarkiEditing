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
  const waktuSekarang = `${hh}-${mm}-${dateStr}`;

  console.log(waktuSekarang);

  // Set nilai default di form popup
  $('#input-date').val(dateStr);
  $('#input-time').val(timeStr);
  $('#input-day').val(dayName);

  // Set watermark default dari template utama
  const $defaultBox = $('.marki-box');
  updateMarkiBoxContent($defaultBox, {
    time: timeStr,
    date: dateStr,
    day: dayName
  });

  // Update nama hari saat tanggal diubah
  $('#input-date').on('change', function () {
    const selectedDate = $(this).val();
    $('#input-day').val(getIndonesianDayName(selectedDate));
  });

  // Toggle sembunyikan/lihat petugas
  $('#hidePetugas').on('change', function () {
    const isChecked = $(this).prop('checked');
    if (isChecked) {
      $('.handler-section').hide();
    } else {
      $('.handler-section').show();
    }
  });

  // Upload gambar
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

  // Terapkan perubahan watermark dari popup
  $('#apply-marki').click(function () {
    if (!currentWatermark) return alert('Tidak ada watermark yang dipilih.');
    updateMarkiBoxContent(currentWatermark, getFormData());
    $('#popup').hide();
    currentWatermark = null;
  });

  // Batal edit watermark
  $('#cancel-button').click(function () {
    $('#popup').hide();
    currentWatermark = null;
  });

  // Unduh ZIP berisi semua gambar
  $('#download-image').click(async function () {
    $('#loading').show();

    const zip = new JSZip();
    const folder = zip.folder("patroli-images-" + waktuSekarang);

    const wrappers = $('.image-wrapper').toArray();

    for (let i = 0; i < wrappers.length; i++) {
      const canvas = await html2canvas(wrappers[i]);
      const dataUrl = canvas.toDataURL('image/png');
      const imgData = dataUrl.split(',')[1];
      folder.file(`patroli_${i + 1}.png`, imgData, { base64: true });
    }

    zip.generateAsync({ type: 'blob' }).then(function (content) {
      saveAs(content, "patroli-foto-" + waktuSekarang + ".zip");
      $('#loading').hide();
    });
  });

  // Fungsi: Isi watermark
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

  // Fungsi: Ambil data dari watermark
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

  // Fungsi: Ambil data dari form popup
  function getFormData() {
    return {
      time: $('#input-time').val() || '00:00',
      date: $('#input-date').val() || '2000-01-01',
      day: $('#input-day').val() || 'Hari',
      location: $('#input-location').val() || 'Jalan Tanpa Nama',
      handler: $('#input-handler').val() || 'Petugas Patroli'
    };
  }

  // Fungsi: Nama hari dalam Bahasa Indonesia
  function getIndonesianDayName(dateStr) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const date = new Date(dateStr);
    if (isNaN(date)) return 'Hari';
    return days[date.getDay()];
  }
});
