import { NextResponse } from "next/server";

export function GET(_request?: unknown) {
  const data = [
    
     {
      id: 1,
      image: "/images/r1.png",
      name: "Embroidered Cotton Satin Shirt",
      price: 4995,
    },
    {
      id: 2,
      image: "/images/r2.png",
      name: "Embroidered Jacquard Shirt",
      price: 2995,
      oldPrice: 4490,
    },
    {
      id: 3,
      image: "/images/r3.png",
      name: "Embroidered Zari Cotton Shirt",
      price: 4495,
      oldPrice: 4490,
    },
    {
      id: 4,
      image: "/images/r4.png",
      name: "Embroidered Jacquard Shirt",
      price: 4495,
      oldPrice: 4490,
    },
    
    {
    id: 5,
    name: "Denim Top With Kimono Sleeves",
    image: "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dwa719adf5/images/June26/29thJune26/WTOP26V60002_999_1.jpg?sw=1000&sh=1200",
    price: 3143,
    oldPrice: 4490
  },
  {
    id: 6,
    name: "Embroidered Blouse",
    image: "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dwad67ed7f/images/April26/6thApril26/WTOP26V30033_999_2.JPG?sw=1000&sh=1200",
    price: 3294,
    oldPrice: 5490
  },
  {
    id: 7,
    name: "Cotton Muslin Shirt",
    image: "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dw0b01f35b/images/April26/6thApril26/WTOP26V30006_999_2.JPG?sw=1000&sh=1200",
    price: 2495,
    oldPrice: 4990
  },
  {
    id: 8,
    name: "Slash Neck Top",
    image: "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dw87fd3f59/images/feb26/11thFeb26/WTOP26V20014_999_2.JPG?sw=1000&sh=1200",
    price: 2495,
    oldPrice: 4990
  },
  {
    id: 9,
    name: "V-Neck Denim Shirt",
    image: "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dwce3b42d7/images/June26/10thJune26/WTOP26V60026_999_2.jpg?sw=1000&sh=1200",
    price: 3143,
    oldPrice: 4490
  },
  {
    id: 10,
    name: "Textured V-Neck Top",
    image: "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dwba7ea1a4/images/June26/10thJune26/WTOP26V20018_999_2.jpg?sw=1000&sh=1200",
    price: 3594,
    oldPrice: 5990
  },
  {
    id: 11,
    name: "Printed Blouse",
    image: "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dw46cf6936/images/May26/7thMay26/WTOP26V40054_999_2.JPG?sw=1000&sh=1200",
    price: 3143,
    oldPrice: 4490
  },
  {
    id: 12,
    name: "Button Through Oxford Shirt",
    image: "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dw1332ab71/images/June26/10thJune26/WTOP26V60027_999_2.jpg?sw=1000&sh=1200",
    price: 3294,
    oldPrice: 5490
  },
  {
    id: 13,
    name: "Softlux Slash Neck T-Shirt",
    image: "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dw6a0a6265/images/May26/7thMay26/WTOP26V40008_999_2.JPG?sw=1000&sh=1200",
    price: 2793,
    oldPrice: 3990
  },
  {
    id: 14,
    name: "Softlux Kimono T-Shirt",
    image: "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dwb317005c/images/May26/7thMay26/WTOP26V40004_999_2.JPG?sw=1000&sh=1200",
    price: 3493,
    oldPrice: 4990
  },
  {
    id: 15,
    name: "Denim Top With Kimono Sleeves",
    image: "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dwd5f7523e/images/June26/10thJune26/WTOP26V60003_999_2.jpg?sw=1000&sh=1200",
    price: 3143,
    oldPrice: 4490
  },
  {
    id: 16,
    name: "Textured V-Neck Top",
    image: "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dwbb7a13a3/images/June26/10thJune26/WTOP26V20017_999_2.jpg?sw=1000&sh=1200",
    price: 3594,
    oldPrice: 5990
  },
  {
    id: 17,
    name: "Cotton Muslin Shirt",
    image: "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dw1b88b2f0/images/April26/6thApril26/WTOP26V30027_999_2.JPG?sw=1000&sh=1200",
    price: 2495,
    oldPrice: 4990
  },
  {
    id: 18,
    name: "Button Through Oxford Shirt",
    image: "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dwcbefe37f/images/June26/10thJune26/WTOP26V60014_999_2.jpg?sw=1000&sh=1200",
    price: 3294,
    oldPrice: 5490
  },
  {
    id: 19,
    name: "Printed Shirt",
    image: "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dw4821830d/images/May26/7thMay26/WTOP26V50020_999_2.JPG?sw=1000&sh=1200",
    price: 3493,
    oldPrice: 4990
  },
  {
    id: 20,
    name: "Button Through Shirt",
    image: "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dwd9a8fe15/images/June26/10thJune26/WTOP26V50026_999_2.jpg?sw=1000&sh=1200",
    price: 3493,
    oldPrice: 4990
  },
  {
    id: 21,
    name: "Button Shirt",
    image: "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dwf28451cb/images/June26/10thJune26/WTOP26V60013_999_2.jpg?sw=1000&sh=1200",
    price: 3493,
    oldPrice: 4990
  },
  {
    id: 22,
    name: "sea green embroidered liminal stitched 3pc",
    image: "https://www.junaidjamshed.com/cdn/shop/files/26-779_2.jpg?v=1786959329&width=1426",
    price: 10990,
    oldPrice: 11000
  },
  {
    id: 23,
    name: "teal embroidered cambric unstitched 2pc",
    image: "https://www.junaidjamshed.com/cdn/shop/files/26-2487_1.jpg?v=1786355646&width=2000",
    price: 4990,
    oldPrice: 5550
  },
  {
    id: 24,
    name: "red embroidered cambric unstitched 2pc",
    image: "https://www.junaidjamshed.com/cdn/shop/files/26-2486_1.jpg?v=1786355638&width=1426",
    price: 4900,
    oldPrice: 5580
  },
  {
    id: 25,
    name: "blue embroidered cambric unstitched 2pc",
    image: "https://www.junaidjamshed.com/cdn/shop/files/26-2485_1.jpg?v=1786355633&width=2000",
    price: 4500,
    oldPrice: 5580
  },
  {
    id: 26,
    name: "off white embroidered cambric unstitched 2pc",
    image: "https://www.junaidjamshed.com/cdn/shop/files/26-2484_1.jpg?v=1786355626&width=2000",
    price: 4300,
    oldPrice: 5000
  },
   {
    id: 27,
    name: "black embroidered dobby unstitched 3pc",
    image: "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4617_3.jpg?v=1786353696&width=2000",
    price: 4200,
    oldPrice: 8000
  },
  {
    id: 28,
    name: "brown embroidered dobby unstitched 3pc",
    image: "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4616_1.jpg?v=1786353693&width=1426",
    price: 4800,
    oldPrice: 8000
  },
  {
    id: 29,
    name: "Beigi embroidered dobby unstitched 3pc",
    image: "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4615_1.jpg?v=1786353674&width=1426",
    price: 4800,
    oldPrice: 8000
  },
  {
    id: 30,
    name: "White embroidered dobby unstitched 3pc",
    image: "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4614_2.jpg?v=1786353593&width=2000",
    price: 4200,
    oldPrice: 8500
  },
  {
    id: 31,
    name: "Blue embroidered dobby unstitched 3pc",
    image: "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4613_4.jpg?v=1786354189&width=1426",
    price: 4300,
    oldPrice: 8500
  },
   {
    id: 32,
    name: " Purple embroidered dobby unstitched 3pc",
    image: "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4612_2.jpg?v=1786354184&width=1426",
    price: 4300,
    oldPrice: 8500
  },
   {
    id: 33,
    name: " Purple embroidered dobby unstitched 3pc",
    image: "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4612_2.jpg?v=1786354184&width=1426",
    price: 4300,
    oldPrice: 8500
  },
  {
  id: 34,
  name: "Orange Cambric Embroidered Stitched 3Pc",
  image: "https://www.junaidjamshed.com/cdn/shop/files/JST-26-2462_4.jpg?v=1786950083&width=1426",
  price: 9990,
  oldPrice: 9990
},
{
  id: 35,
  name: "Blue Cambric Embroidered Stitched 3Pc",
  image: "https://www.junaidjamshed.com/cdn/shop/files/26-788_1.jpg?v=1787125631&width=2000",
  price: 8990,
  oldPrice: 8990
},
{
  id: 36,
  name: "Aqua Blue Cambric Digital Printed Stitched 3Pc",
  image: "https://www.junaidjamshed.com/cdn/shop/files/26-787_1_b6a5f6b9-dfdb-44ca-8ee9-20ed67a6e824.jpg?v=1787125603&width=2000",
  price: 7990,
  oldPrice: 7990
},
{
  id: 37,
  name: "Green Cambric Digital Printed Stitched 3Pc",
  image: "https://www.junaidjamshed.com/cdn/shop/files/26-786_1.jpg?v=1787125579&width=1426",
  price: 7990,
  oldPrice: 7990
},
{
  id: 38,
  name: "Pink Cambric Digital Printed Stitched 3Pc",
  image: "https://www.junaidjamshed.com/cdn/shop/files/26-785_1.jpg?v=1787125547&width=1426",
  price: 7990,
  oldPrice: 7990
},
{
  id: 39,
  name: "Light Green Cambric Digital Printed Stitched 3Pc",
  image: "https://www.junaidjamshed.com/cdn/shop/files/26-784_1.jpg?v=1786959393&width=1426",
  price: 7990,
  oldPrice: 7990
},
{
  id: 40,
  name: "Black Lawn Embroidered Stitched 3Pc",
  image: "https://www.junaidjamshed.com/cdn/shop/files/26-781_1.jpg?v=1786959355&width=2000",
  price: 12990,
  oldPrice: 12990
},
{
  id: 41,
  name: "Pink Lawn Embroidered Stitched 3Pc",
  image: "https://www.junaidjamshed.com/cdn/shop/files/26-780_1.jpg?v=1786959337&width=2000",
  price: 14990,
  oldPrice: 14990
},
{
  id: 42,
  name: "Green Lawn Embroidered Stitched 3Pc",
  image: "https://www.junaidjamshed.com/cdn/shop/files/26-763_1.jpg?v=1787125384&width=2000",
  price: 12990,
  oldPrice: 12990
},
{
  id: 43,
  name: "Blue Lawn Embroidered Stitched 3Pc",
  image: "https://www.junaidjamshed.com/cdn/shop/files/26-672_1.jpg?v=1786958872&width=2000",
  price: 12990,
  oldPrice: 12990
},
{
  id: 44,
  name: "Maroon Dobby Printed Stitched 2Pc",
  image: "https://www.junaidjamshed.com/cdn/shop/files/26-671_1.jpg?v=1786958803&width=2000",
  price: 7490,
  oldPrice: 7490
},
{
  id: 45,
  name: "PINK LAWN EMBROIDERED KURTA",
  image: "https://www.junaidjamshed.com/cdn/shop/files/26-761_1_50f1eca0-51eb-465d-aba5-c81ca9ace034.jpg?v=1787125292&width=1426",
  price: 4490,
  oldPrice: 4490
},
{
  id: 46,
  name: "Blue Lawn Embroidered Stitched 3Pc",
  image: "https://www.junaidjamshed.com/cdn/shop/files/JST-26-2464_1.jpg?v=1786949997&width=2000",
  price: 9990,
  oldPrice: 9990
},
{
  id: 47,
  name: "Blue Lawn Embroidered Co Ord Set",
  image: "https://www.junaidjamshed.com/cdn/shop/files/26-764_1.jpg?v=1787125462&width=1426",
  price: 6990,
  oldPrice: 6990
},
{
  id: 48,
  name: "Brown Dobby Embroidered Stitched 3Pc",
  image: "https://www.junaidjamshed.com/cdn/shop/files/JST-26-2467_3.jpg?v=1786950024&width=1426",
  price: 9990,
  oldPrice: 9990
},
{
  id: 49,
  name: "White Dobby Embroidered Stitched 3Pc",
  image: "https://www.junaidjamshed.com/cdn/shop/files/26-712_1.jpg?v=1787125742&width=1426",
  price: 9990,
  oldPrice: 9990
},
{
  id: 50,
  name: "Sans Embroidered Co Ord Set",
  image: "https://www.junaidjamshed.com/cdn/shop/files/JST-26-2466_3_-Copy.jpg?v=1786967789&width=2000",
  price: 6990,
  oldPrice: 6990
},
{
  id: 51,
  name: "Multicolor Lawn Embroidered Co Ord Set",
  image: "https://www.junaidjamshed.com/cdn/shop/files/JDS-26-1172_5.jpg?v=1786949909&width=1426",
  price: 6990,
  oldPrice: 6990
},
{
  id: 52,
  name: "Multi Lawn Embroidered Co Ord Set",
  image: "https://www.junaidjamshed.com/cdn/shop/files/JST-26-2461_5.jpg?v=1786950077&width=2000",
  price: 6990,
  oldPrice: 6990
},
{
  id: 53,
  name: "Black Lawn Embroidered Co-Ord Set",
  image: "https://www.junaidjamshed.com/cdn/shop/files/JST-26-2460_2.jpg?v=1786950069&width=1426",
  price: 7490,
  oldPrice: 7490
},
{
  id: 54,
  name: "Red Lawn Embroidered Co-Ord Set",
  image: "https://www.junaidjamshed.com/cdn/shop/files/26-4083_1.jpg?v=1786959999&width=1426",
  price: 7990,
  oldPrice: 7990
},
{
  id: 55,
  name: "Blue Jacquard Embroidered Co Ord Set",
  image: "https://www.junaidjamshed.com/cdn/shop/files/26-4077_1.jpg?v=1786959956&width=2000",
  price: 7490,
  oldPrice: 7490
},
{
  id: 56,
  name: "Pink Jacquard Embroidered Co Ord Set",
  image: "https://www.junaidjamshed.com/cdn/shop/files/26-747_1.jpg?v=1786958617&width=1426",
  price: 7490,
  oldPrice: 7490
},
{
  id: 57,
  name: "Maroon Jacquard Embroidered Co Ord Set",
  image: "https://www.junaidjamshed.com/cdn/shop/files/JPS-26-4050_3_a1de3639-b140-4614-a5a4-13193f2fb64a.jpg?v=1786949925&width=1426",
  price: 7490,
  oldPrice: 7490
},
{
  id: 58,
  name: "Black Jacquard Embroidered Co Ord Set",
  image: "https://www.junaidjamshed.com/cdn/shop/files/JST-S-26-2435_1.jpg",
  price: 7490,
  oldPrice: 7490
},

  {
    "id": 59,
    "name": "Green Unstitched 3Pc",
    "price": 4990,
    "oldPrice": 9000,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1474_1_c79cf695-5edf-4b49-974a-6d194768e098.jpg?v=1787310656&width=2000",
    "style": "JPLU-99-1198 ALARI"
  },
  {
    "id": 60,
    "name": "Beige Unstitched 3Pc",
    "price": 4080,
    "oldPrice": 6000,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1357_1.jpg?v=1786973341&width=1426",
    "style": "JPLU-99-1193 MILKY SHEER"
  },
  {
    "id": 61,
    "name": "Yellow Unstitched 3Pc",
    "price": 7000,
    "oldPrice": 8000,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1238_1.jpg?v=1786975464&width=2000",
    "style": "JPLU-99-1192 MEWAR"
  },
  {
    "id": 62,
    "name": "Multicolor Unstitched 3Pc",
    "price": 3400,
    "oldPrice": 4000,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1238_1.jpg?v=1786975464&width=2000",
    "style": "JPLU-99-1189 ETHNIC PAISLEY"
  },
  {
    "id": 63,
    "name": "Yellow Unstitched 3Pc",
    "price": 3500,
    "oldPrice": 5000,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1198_3.jpg?v=1786975377&width=940",
    "style": "JPLU-99-1215 ETHNIC ART"
  },
  {
    "id": 64,
    "name": "Beige Unstitched 3Pc",
    "price": 3000,
    "oldPrice": 4000,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1193_1.jpg?v=1786975335&width=1426",
    "style": "JPLU-99-1122 SIMT"
  },
  {
    "id": 65,
    "name": "Brown Unstitched 3Pc",
    "price": 2000,
    "oldPrice": 3000,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1192_1.jpg?v=1786974339&width=1426",
    "style": "JPLU-99-1093 MADDER-1-22"
  },
  {
    "id": 66,
    "name": "Black Unstitched 3Pc",
    "price": 1500,
    "oldPrice": 2000,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1189_2.jpg?v=1786974295&width=360",
    "style": "JPLU-99-1088 NOIR."
  },
  {
    "id": 67,
    "name": "Brown Unstitched 3Pc",
    "price": 1000,
    "oldPrice": 2000,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1215_2.jpg?v=1786975423&width=360",
    "style": "JPLU-99-1071 RANGOLI"
  },
  {
    "id": 68,
    "name": "Black Unstitched 3Pc",
    "price": 3500,
    "oldPrice": 4500,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1093_1.jpg?v=1786974179&width=1426",
    "style": "JPLU-99-1047 ROGAN 2"
  },
  {
    "id": 69,
    "name": "Green Unstitched 3Pc",
    "price": 4200,
    "oldPrice": 5200,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1088_1.jpg?v=1786974142&width=1426",
    "style": "JPLU-99-1044 GLIMMER"
  },
  {
    "id": 70,
    "name": "Black Unstitched 3Pc",
    "price": 4080,
    "oldPrice": 5200,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1071_1.jpg?v=1786973281&width=1426",
    "style": "JPLU-99-1041 FUSION"
  },
  {
    "id": 71,
    "name": "Multicolor Unstitched 3Pc",
    "price": 5300,
    "oldPrice": 6000,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1047_1.jpg?v=1786973206&width=2000",
    "style": "JPLU-99-1559"
  },
  {
    "id": 72,
    "name": "Multicolor Unstitched 3Pc",
    "price": 1200,
    "oldPrice": 1600,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1041_1.jpg?v=1786973099&width=1426",
    "style": "JPLU-99-1512"
  },
  {
    "id": 73,
    "name": "Multicolor Unstitched 3Pc",
    "price": 3450,
    "oldPrice": 3500,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1559_4.jpg?v=1786973672&width=1426",
    "style": "JPLU-99-1506"
  },
  {
    "id": 74,
    "name": "Multicolor Unstitched 3Pc",
    "price": 6000,
    "oldPrice": 6500,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1512_1.jpg?v=1786973605&width=1426",
    "style": "JPLU-99-1499"
  },
  {
    "id": 75,
    "name": "Multicolor Unstitched 3Pc",
    "price": 6300,
    "oldPrice": 7000,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1506_1.jpg?v=1786973561&width=1426",
    "style": "JPLU-99-1478"
  },
  {
    "id": 76,
    "name": "Multicolor Unstitched 3Pc",
    "price": 6400,
    "oldPrice": 7000,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1499_1.jpg?v=1786973518&width=1426",
    "style": "JPLU-99-1324"
  },
  {
    "id": 77,
    "name": "Beige Unstitched 3Pc",
    "price": 4800,
    "oldPrice": 9000,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1478_1.jpg?v=1786973474&width=1426",
    "style": "JPLU-99-1040 DREAM"
  },
  {
    "id": 78,
    "name": "Teal Embroidered Cambric Unstitched 2Pc",
    "price": 7000,
    "oldPrice": 7400,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1324_1.jpg?v=1786975533&width=1426",
    "style": "JST-S-26-2487 RAQS-4"
  },
  {
    "id": 79,
    "name": "Red Embroidered Cambric Unstitched 2Pc",
    "price": 4990,
    "oldPrice": 5000,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1040_2.jpg?v=1786973046&width=940",
    "style": "JST-S-26-2486 RAQS-3"
  },
  {
    "id": 80,
    "name": "Blue Embroidered Cambric Unstitched 2Pc",
    "price": 10000,
    "oldPrice": 11000,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/26-2487_1.jpg?v=1786355646&width=1426",
    "style": "JST-S-26-2485 RAQS-2"
  },
  {
    "id": 81,
    "name": "Off White Embroidered Cambric Unstitched 2Pc",
    "price":3000,
    "oldPrice": 3500,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/26-2486_1.jpg?v=1786355638&width=1426",
    "style": "JST-S-26-2484 RAQS-1"
  },
  {
    "id": 82,
    "name": "Black Embroidered Dobby Unstitched 3Pc",
    "price": 6990,
    "oldPrice": 7000,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/26-2485_1.jpg?v=1786355633&width=2000",
    "style": "JLU-S-26-4617 THREADED BLOOM-4"
  },
  {
    "id": 83,
    "name": "Brown Embroidered Dobby Unstitched 3Pc",
    "price": 5500,
    "oldPrice": 5600,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/26-2484_1.jpg?v=1786355626&width=1426",
    "style": "JLU-S-26-4616 THREADED BLOOM-3"
  },
  {
    "id": 84,
    "name": "Beige Embroidered Dobby Unstitched 3Pc",
    "price": 8700,
    "oldPrice": 9000,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4617_3.jpg?v=1786353696&width=1426",
    "style": "JLU-S-26-4615 THREADED BLOOM-2"
  },
  {
    "id": 85,
    "name": "White Embroidered Dobby Unstitched 3Pc",
    "price": 8900,
    "oldPrice": 9200,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4616_1.jpg?v=1786353693&width=1426",
    "style": "JLU-S-26-4614 THREADED BLOOM-1"
  },
  {
    "id": 86,
    "name": "Pink Embroidered Dobby Unstitched 3Pc",
    "price": 9000,
    "oldPrice": 9800,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4615_1.jpg?v=1786353674&width=1426",
    "style": "JLU-S-26-4613 THREADED BLOOM"
  },
  {
    "id": 87,
    "name": "Green Embroidered Dobby Unstitched 3Pc",
    "price": 1800,
    "oldPrice": 2000,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/26-2485_1.jpg?v=1786355633&width=2000",
    "style": "JLU-S-26-4612 THREADED BLOOM"
  },
  {
    "id": 88,
    "name": "Blue Embroidered Dobby Unstitched 3Pc",
    "price": 2800,
    "oldPrice": 3000,
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4322_5.jpg?v=1786354093&width=1426",
    "style": "JLU-S-26-4611 THREADED BLOOM"
  },
  
  {
    "id": 89,
    "name": "PINK ORGANZA EMBROIDERED FORMAL STITCHED 3PC",
    "image": "https://www.junaidjamshed.com/cdn/shop/files/JPS-26-4088_3.jpg?v=1777316663&width=880",
    "price": 27990,
    "oldPrice": 28000,
    "productId": "JPS264088S"
  },
  {
    "id": 90,
    "name": "BEIGE RAW SILK EMBROIDERED FORMAL CO-ORD SET",
    "image": 'https://www.junaidjamshed.com/cdn/shop/files/jps-26-4045_2_1f5fd380-4b51-4783-a967-27ffde179aeb.jpg?v=1777087474&width=823',
    "price": 12990,
    "oldPrice": 13000,
    "productId": "JPS264045S"
  },
  {
    "id": 91,
    "name": "LILAC RAW SILK EMBROIDERED CO-ORD SET",
    "image": 'https://www.junaidjamshed.com/cdn/shop/files/jps-26-3996_1__8_401ebf87-a8d5-43d7-81f2-4df43907b68b.jpg?v=1776974846&width=880',
    "price": 12950,
    "oldPrice": 14000 ,
    "productId": "JPS263996S"
  },
  {
    "id": 92,
    "name": "LILAC RAW SILK EMBROIDERED STITCHED 3PC",
    "image": 'https://www.junaidjamshed.com/cdn/shop/files/jps-26-4015_4_90789b3d-73c4-4f99-810f-3c9c74db5c65.jpg?v=1776974845&width=880',
    "price": 19990,
    "oldPrice": 20000,
    "productId": "JPS264015S"
  },
  {
    "id": 93,
    "name": "BLACK RAW SILK EMBROIDERED CO-ORD SET",
    "image": 'https://www.junaidjamshed.com/cdn/shop/files/jps-26-4043s_1_4e28699c-9f4f-44a3-85b8-d00c88a57b52.jpg?v=1776974854&width=880',
    "price": 12990,
    "oldPrice": 15000,
    "productId": "JPS264043S"
  },
  {
    "id": 94,
    "name": "BLUE IMPURE CHIFFON EMBROIDERED STITCHED 3PC",
    "image": 'https://www.junaidjamshed.com/cdn/shop/files/jps-26-4005s_1_fb876ec2-10d6-4636-980b-50f62ce025a0.jpg?v=1776974845&width=823',
    "price": 16990,
    "oldPrice": 18000,
    "productId": "JPS264005S"
  },
  {
    "id": 95,
    "name": "MUSTARD MAPLE SILK EMBROIDERED CO-ORD SET",
    "image": 'https://www.junaidjamshed.com/cdn/shop/files/jps-26-4014s_1_4ed69f23-a490-4765-95df-68040a3f1af3.jpg?v=1776974845&width=823',
    "price": 12990,
    "oldPrice": 14000,
    "productId": "JPS263998S"
  },
  {
    "id": 96,
    "name": "BEIGE PAPER COTTON EMBROIDERED CO-ORD SET",
    "image": 'https://www.junaidjamshed.com/cdn/shop/files/jps-26-4022s_1_c8d0a850-8ad9-4122-b27f-08faed97beb0.jpg?v=1776974845&width=823',
    "price": 12900,
    "oldPrice": 13000 ,
    "productId": "JPS264044S"
  },
  {
    "id": 97,
    "name": "WHITE RAW SILK EMBROIDERED STITCHED 3PC",
    "image": 'https://www.junaidjamshed.com/cdn/shop/files/jps-26-3997s_1_f3e85ef5-287b-421c-85ef-a823d0257033.jpg?v=1776974804&width=823',
    "price": 19990,
    "oldPrice": 20000,
    "productId": "JPS264014S"
  },
  {
    "id": 98,
    "name": "MAROON PAPER COTTON EMBROIDERED STITCHED 3PC",
    "image": 'https://www.junaidjamshed.com/cdn/shop/files/jps-26-4047s_1_193dcedf-37f9-4ea5-8024-1d55170c281d.jpg?v=1776974723&width=823',
    "price": 14990,
    "oldPrice": 15000,
    "productId": "JPS264022S"
  },
  {
    "id": 99,
    "name": "PINK RAW SILK EMBROIDERED CO-ORD SET",
    "image": 'https://www.junaidjamshed.com/cdn/shop/files/jps-26-4048s_1_06d07da9-3b53-44fb-9f40-cf230e6d2ff5.jpg?v=1776975321&width=880',
    "price": 11990,
    "oldPrice": 12000,
    "productId": "JPS263997S"
  },
  {
    "id": 100,
    "name": "PINK COTTON NET EMBROIDERED FORMAL CO-ORD SET",
    "image": 'https://www.junaidjamshed.com/cdn/shop/files/26-4002s_1_36b47fc8-96df-4fbd-8ba3-f40d89efb2a4.jpg?v=1777087467&width=823',
    "price": 11990,
    "oldPrice": 13000,
    "productId": "JPS264047S"
  }



  ];

  return NextResponse.json(data);
}