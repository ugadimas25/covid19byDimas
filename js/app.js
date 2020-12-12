/* HealthMap Boston Children’s Hospital https://www.healthmap.org/
 * Credit MapBox Community 
 * Redesign/Custom visualization
 * In collaboration with the Open COVID-19 Data Curation Group
 */

// Konstanta waktu animasi dan simbol warna jumlah kasus
const DURASI_ANIMASI_MS = 300;
const COLOR_MAP = [
  ['#67009e', '< 10', 10],
  ['#921694', '11–100', 100],
  ['#d34d60', '101–500', 500],
  ['#fb9533', '501–2000', 2000],
  ['#edf91c', '> 2000'],
  ['cornflowerblue', 'Kasus Baru'],
]

// Konstanta simbol warna indeks kualitas udara
const AQI_MAP = [
  ['#009966', '0-50 Baik'],
  ['#ffde33', '51–100 Sedang'],
  ['#ff9933', '101–150 Tidak Sehat untuk Grup Sensitif'],
  ['#cc0033', '151–200 Tidak Sehat'],
  ['#660099', '201–300 Sangat Tidak Sehat'],
  ['#7e0023', '200+ Berbahaya'],
]

// Konstanta runtime 
const timestamp = (new Date()).getTime();

// Variable lokasi dan nama negara, tanggal dan peta.
let location_info = {};
let dates = [];
let map;

// Pengaturan slider time control dan isi slider (date).

let featuresByDay = {};
let timeControl = document.getElementById('slider');

function showDataAtDate(isodate) {
  map.getSource('counts').setData(featuresByDay[isodate]);
}

function setTimeControlLabel(date) {
  document.getElementById('date').innerText = dates[date];
}

function buildTimeControl() {
  document.getElementById('range-slider').style.display = 'flex';
  timeControl.setAttribute('max', dates.length - 1)
  timeControl.setAttribute('value', dates.length - 1);
  setTimeControlLabel(dates.length - 1);
}

function animateMap() {
  let i = 0;
  let stepMap = setInterval(function() {
    timeControl.value = i;
    showDataAtDate(dates[i]);
    setTimeControlLabel(i);
    i++;
    if (i === dates.length) {
      clearInterval(stepMap);
    }
  }, DURASI_ANIMASI_MS);
}


function zfill(n, width) {
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}


function oneDayBefore(dateString) {

  let parts = dateString.split('-');
  let date = new Date(parts[0], parseInt(parts[1]) - 1, parts[2]);
  date.setDate(date.getDate() - 1);
  return [date.getFullYear(),
          zfill(date.getMonth() + 1, 2),
          zfill(date.getDate(), 2)].join('-');
}

/**
 * Mengambil data harian. 
 * Pengambilan dimulai dari data terbaru.
 */
function fetchDailySlice(dateString) {
  dateString = dateString || 'latest';

  let url = './data/' + dateString.replace(/-/g, '.') + '.json';
  if (dateString == 'latest') {
    url += '?nocache=' + timestamp;
  }
  fetch(url)
      .then(function(response) {
        if (response.status == 200) {
          return response.json();
        } else {

          onAllDailySlicesFetched();
        }
      })
      .then(function(jsonData) {
        if (!jsonData) {
          return;
        }
        let currentDate = jsonData.date;
        // Memasukkan kembali fitur pada objects yang dikenali peta (mapbox), Reformat struktur ke geojson.
        jsonData.type = 'FeatureCollection';
        for (let i = 0; i < jsonData.features.length; i++) {
          let feature = jsonData.features[i];
          feature.type = 'Feature';
          let coords = feature.properties.geoid.split('|');
          // Membalik latitude dan longitude.
          feature.geometry = {'type': 'Point', 'coordinates': [coords[1], coords[0]]};
        }

        dates.unshift(currentDate);
        featuresByDay[currentDate] = jsonData;

        // Hanya menggunakan data terbaru untuk peta sampai data terdownload semuanya.
        if (dateString == 'latest') {
          map.getSource('counts').setData(jsonData);
        }
        // Mengambil potongan data sebelumnya
        fetchDailySlice(oneDayBefore(currentDate));
  });
}

function onAllDailySlicesFetched() {
  buildTimeControl();
  document.getElementById('spread').addEventListener('click', animateMap);
}

// Load data lokasi (location data) (nama geografis dari latitude dan longitude).
fetch('./data/location_info.txt')
  .then(function(response) { return response.text(); })
  .then(function(responseText) {
    let lines = responseText.split('\n');
    for (let i = 0; i < lines.length; i++) {
      let parts = lines[i].split(':');
      location_info[parts[0]] = parts[1];
    }
  });

// Muat jumlah terbaru dari scraper
fetch('./data/latestCounts.json?nocache=' + timestamp)
  .then(function(response) { return response.json(); })
  .then(function(jsonData) {
    document.getElementById('total-cases').innerText = jsonData[0].caseCount;
    document.getElementById('last-updated-date').innerText = jsonData[0].date;
  });

// Membuat list lokasi dan jumlah kasus terkonfiirmasi COVID-19
fetch('./data/jhu.json?nocache=' + timestamp)
  .then(function(response) { return response.json(); })
  .then(function(jsonData) {
    let obj = jsonData.features;
    list = '';
    for (let i = 0; i < obj.length; ++i) {
      let location = obj[i];
      let name, lat, lon, cumConf, legendGroup;
      name = location.attributes.ADM0_NAME ? location.attributes.ADM0_NAME : '';
      lat = location.centroid.x ? location.centroid.x : 0;
      lon = location.centroid.y ? location.centroid.y : 0;
      cumConf = location.attributes.cum_conf ? location.attributes.cum_conf : 0;
      legendGroup = location.attributes.legendGroup ? location.attributes.legendGroup : '';
      list += '<li><button onClick="handleFlyTo(' + lat + ',' + lon + ',' + 4 + ')"><span class="label">' + name + '</span><span class="num legend-group-' + legendGroup + '">' + cumConf + '</span></span></button></li>';
    }
    document.getElementById('location-list').innerHTML = list;
  });

// Filter list lokasi
function filterList() {
  let filter = document.getElementById('location-filter').value.toUpperCase();
  ul = document.getElementById('location-list');
  let list_items = document.getElementById('location-list').getElementsByTagName('li');
  let clearFilter = document.getElementById('clear-filter');
  // Loop semua item pada list, dan sembunyikan yang tidak sesuai dengan permintaan pencarian
  for (let i = 0; i < list_items.length; ++i) {
    let label = list_items[i].getElementsByClassName('label')[0];
    let txtValue = label.textContent || label.innerText;
    // Tampilkan/sembunyikan tombol hapus filter.
    clearFilter.style.display = !!filter ? 'flex' : 'none';

    // Tampilkan/sembunyikan list item yang sesuai.
    const show = txtValue.toUpperCase().indexOf(filter) != -1;
    list_items[i].style.display = show ? 'list-item' : 'none';
  }
}

function clearFilter() {
  document.getElementById('location-filter').value = '';
  filterList();
}

function handleShowModal(html) {
  let modal = document.getElementById('modal');
  let modalWrapper = document.getElementById('modal-wrapper');
  // switch elements untuk 'display' value (block, flex) tetapi tetpa disembunyikan dengan opacity
  modalWrapper.classList.add('is-block');
  modal.classList.add('is-flex');
  setTimeout(function () {
    modalWrapper.classList.add('is-visible');
    modal.classList.add('is-visible');
  }, 40);
  modal.innerHTML = html;
}

function handleHideModal() {
  let modal = document.getElementById('modal');
  let modalWrapper = document.getElementById('modal-wrapper');
  modalWrapper.classList.remove('is-visible');
  modal.classList.remove('is-visible');
  setTimeout(function () {
    modalWrapper.classList.remove('is-block');
    modal.classList.add('is-flex');
  }, 400);
}

// Menampilkan legenda
function showLegend() {
  let list = document.getElementById('legend').getElementsByTagName('ul')[0];
  for (let i = 0; i < COLOR_MAP.length; i++) {
    let color = COLOR_MAP[i];
    let item = document.createElement('li');
    let circle = document.createElement('span');
    circle.className = 'circle';
    circle.style.backgroundColor = color[0];
    let label = document.createElement('span');
    label.className = 'label';
    label.textContent = color[1];
    item.appendChild(circle);
    item.appendChild(label);
    list.appendChild(item);
  }
}

function showLegendAQI() {
  let list = document.getElementById('legend').getElementsByTagName('ul')[0];
  for (let i = 0; i < AQI_MAP.length; i++) {
    let color = AQI_MAP[i];
    let item = document.createElement('li');
    let circle = document.createElement('span');
    circle.className = 'circle';
    circle.style.backgroundColor = color[0];
    let label = document.createElement('span');
    label.className = 'label';
    label.textContent = color[1];
    item.appendChild(circle);
    item.appendChild(label);
    list.appendChild(item);
  }
}

// Inisialisasi peta, key token, source, tipe, custom style, 
// font label dan overlay data index kualitas udara
function initMap() {
  mapboxgl.accessToken = 'pk.eyJ1IjoibmFpbmRyIiwiYSI6ImNrOWtydzl4dDAyaHUzbW9jeGQ0Z2M3a2YifQ.lJBv65Gcd0aNiD4kS0kYEQ';
  let mapStyle = {
        'version': 8,
        'name': 'Dark',
        'sources': {
            'mapbox': {
                'type': 'vector',
                'url': 'mapbox://mapbox.mapbox-streets-v8'
            },
            'overlay': {
                'type': 'raster',
                'tiles': [
                        'https://tiles.aqicn.org/tiles/usepa-aqi/{z}/{x}/{y}.png?token=45aa870c722ed27fd997be613a738cbf892fe867'
                    ],
               'tileSize': 256,
            }
        },
        'sprite': 'mapbox://sprites/mapbox/dark-v10',
        'glyphs': 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
        'layers': [
            {
                'id': 'background',
                'type': 'background',
                'paint': { 'background-color': '#111' }
            },
            {
                'id': 'water',
                'source': 'mapbox',
                'source-layer': 'water',
                'type': 'fill',
                'paint': { 'fill-color': '#2c2c2c' }
            },
            {
                'id': 'boundaries',
                'source': 'mapbox',
                'source-layer': 'admin',
                'type': 'line',
                'paint': {
                    'line-color': '#797979',
                    'line-dasharray': [2, 2, 6, 2]
                },
                'filter': ['all', ['==', 'maritime', 0]]
            },
            {
                'id': 'overlay',
                'source': 'overlay',
                'type': 'raster',
                'paint': { 'raster-opacity': 0.85 }
            },
            {
                'id': 'cities',
                'source': 'mapbox',
                'source-layer': 'place_label',
                'type': 'symbol',
                'layout': {
                    'text-field': '{name_en}',
                    'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
                    'text-size': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        4,
                        9,
                        6,
                        12
                    ]
                },
                'paint': {
                    'text-color': '#969696',
                    'text-halo-width': 2,
                    'text-halo-color': 'rgba(0, 0, 0, 0.85)'
                }
            },
            {
                'id': 'states',
                'source': 'mapbox',
                'source-layer': 'place_label',
                'type': 'symbol',
                'layout': {
                    'text-transform': 'uppercase',
                    'text-field': '{name_en}',
                    'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
                    'text-letter-spacing': 0.15,
                    'text-max-width': 7,
                    'text-size': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        4,
                        10,
                        6,
                        14
                    ]
                },
                'filter': ['==', ['get', 'class'], 'state'],
                'paint': {
                    'text-color': '#969696',
                    'text-halo-width': 2,
                    'text-halo-color': 'rgba(0, 0, 0, 0.85)'
                }
            }
        ]
    };
  
  // Set kontainer peta
  map = new mapboxgl.Map({
    container: 'map',
    style: mapStyle,
    center: [10, 0],
    zoom: 1,
  }).addControl(new mapboxgl.NavigationControl());

  //Set fly zoom in ke lokasi berdasarkan item list lokasi
  window.handleFlyTo = function(lat, lon, zoom, item) {
    map.flyTo({ center: [lat, lon], zoom: zoom })
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }

  timeControl.addEventListener('input', function() {
    setTimeControlLabel(timeControl.value);
    showDataAtDate(dates[timeControl.value]);
  });

  map.on('load', function () {
    map.addSource('counts', {
      'type': 'geojson',
      'data': {
        'type': 'FeatureCollection',
        'features': []
      }
    });
    let circleColor = ['step', ['get', 'total']];
    for (let i = 0; i < COLOR_MAP.length - 1; i++) {
      let color = COLOR_MAP[i];
      circleColor.push(color[0]);
      if (color.length > 2) {
        circleColor.push(color[2]);
      }
    }
    map.addLayer({
      'id': 'totals',
      'type': 'circle',
      'source': 'counts',
      'paint': {
        'circle-radius': [ 'case', ['<', 0, ['number', ['get', 'total']]], ['*', ['log10', ['sqrt', ['get', 'total']]], 10], 0 ],
        'circle-color': circleColor,
        'circle-opacity': .6,
    }});
    map.addLayer({
      'id': 'daily',
      'type': 'circle',
      'source': 'counts',
      'paint': {
        'circle-radius': [ 'case', ['<', 0, ['number', ['get', 'new']]], ['*', ['log10', ['sqrt', ['get', 'new']]], 10], 0 ],
        'circle-color': 'cornflowerblue',
        'circle-opacity': 0.6,
      }
    });
	
	

    // Membuat popup.
    let popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    });

    map.on('mouseenter', 'totals', function (e) {
      // Mengubah style cursor.
      map.getCanvas().style.cursor = 'pointer';

      let props = e.features[0].properties;
      let geo_id = props.geoid;
      let coordinatesString = geo_id.split('|');
      let lat = parseFloat(coordinatesString[0]);
      let lng = parseFloat(coordinatesString[1]);
      // Negara, provinsi, kota
      let location = location_info[geo_id].split(',');
      // Menghapus string kosong
      location = location.filter(function (el) { return el != ''; });
      let description =
        '<h3 class="popup-header">' + location.join(', ') + '</h3>' +
        '<div>' + '<strong>Number of Cases: </strong>' + props.total + '</div>';

      // Memastika perbesaran peta sehingga fitur-fitur terlihat dan popup muncul
      while (Math.abs(e.lngLat.lng - lng) > 180) {
        lng += e.lngLat.lng > lng ? 360 : -360;
      }

      // Isi popup dan untuk mengatur koordinatnya
      // berdasarkan fitur yang ditemukan.
      popup
        .setLngLat([lng, lat])
        .setHTML(description)
        .addTo(map);
    });

    map.on('mouseleave', 'totals', function () {
      map.getCanvas().style.cursor = '';
      popup.remove();
    });

    fetchDailySlice();
    showLegend();
    showLegendAQI();
  });
}
