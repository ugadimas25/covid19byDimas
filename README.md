README: 
=================================================

Daftar Isi
-----------------

* [Pengantar](#pengantar)
* [Data](#data)
* [Pengolahan Data](#pengolahan-data)
* [Library](#library)
* [Live Demo](#live-demo)
* [Issue](#issue)
* [Acknowledgments](#acknowledgments)



Pengantar
------------

Ini merupakan project akhir dari tugas Web Geo.  Project ini terkait dengan visualisasi dengan memanfaatkan MapBox library dan beberapa JavaScript library lainnya untuk memvisualisasikan terkait dengan Status Indeks Kualitas Udara dengan Kasus COVID-19 Global.


Data
------------

Sumber Dataset COVID-19 Global berasal dari [Open Data COVID-19 Data Working Group](https://github.com/beoutbreakprepared/nCoV2019/) , dengan range data yang digunakan dalam visualisasi dari 14 Januari – 6 Mei 2020. 

Sumber data indeks kualitas udara diperoleh dari [The World Air Quality Index (AQI) Project](https://aqicn.org/contribute/) Environmental Protection Agency (EPA) worldwide. Frekuensi data terupdate per 1-3 jam dari Web services Real-time Data & API Tile Map Air Quality Index (AQI) EPA.


Pengolahan Data
------------
Pengolahan data dilakukan pada pengubahan struktur JSON ke GeoJSON format. Proses ini dilakukan secara otomatis dengan menggunakan fungsi javascript pada bagian app.js, pengolahan tersebut dengan tujuan agar data JSON dapat ditampilkan langsung pada map (MapBox).

Library
-----

mapbox-gl-js

fetch.min.js

bluebird.min.js

Live Demo
---------------
Best Viewed with Microsoft Edge
https://isnain-dr.github.io/
![](https://isnain-dr.github.io/img/webgeo_demo.gif)

Issue
-----
Terkait Cross-Origin resource data
Jika data tidak terload ada kemungkinan issue terkait CROS, Origin Policy disallows reading the remote resource, atau perubahan policy pengaturan izin reading data, hanya boleh dalam satu domain yang sama dengan resource service. 

Acknowledgments
---------------

[MapBox](https://www.mapbox.com/)

[HealthMap](https://www.healthmap.org/en/)

[Open Data Working Group COVID-19 Global](https://github.com/beoutbreakprepared/nCoV2019/)

[The World Air Quality Project EPA Worldwide](https://aqicn.org/contact)

