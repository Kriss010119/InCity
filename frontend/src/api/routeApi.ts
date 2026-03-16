import axios from "axios";
import { mapAttractionsToBackend } from "../components/panels/input-panel/helpers/filterConstants";
import type { FormData } from "../components/panels/input-panel/helpers/types";
import type { RouteResponse } from "../types/types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5001",
  timeout: 10000,
});

const toCsv = (values?: string[]) => (values && values.length > 0 ? values.join(",") : "");

export const buildRouteFromPoint = async (formData: FormData): Promise<RouteResponse> => {
  if (formData.destinationLat == null || formData.destinationLng == null) {
    throw new Error("Destination coordinates are required");
  }

  const { main, sub } = mapAttractionsToBackend(formData.attractions || []);
  const response = await api.get<RouteResponse>("/route-from-point", {
    params: {
      lat: formData.destinationLat,
      lng: formData.destinationLng,
      duration: formData.duration || "medium",
      transport: toCsv(formData.transport),
      attractions: toCsv([...new Set(main)]),
      subattractions: toCsv(sub),
      events: toCsv(formData.events),
    },
  });

  return response.data;
};

export const buildRouteFromOrder = async (
  arrivalCode: string,
  date: string,
  duration: "very-short" | "short" | "medium" | "long",
  transport?: string[],
  attractions?: string[],
  events?: string[],
): Promise<RouteResponse> => {
  const { main, sub } = mapAttractionsToBackend(attractions || []);
  const response = await api.get<RouteResponse>("/route-from-order", {
    params: {
      arrivalCode,
      date,
      duration,
      transport: toCsv(transport),
      attractions: toCsv([...new Set(main)]),
      subattractions: toCsv(sub),
      events: toCsv(events),
    },
  });

  return response.data;
};

export const buildRoute = async (
  to: string, 
  date: string, 
  transport?: string[],
  attractions?: string[],
  events?: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ticketData?: any
): Promise<RouteResponse> => {
  try {
    const requestData = {
      destination: to,
      date: date,
      transport: transport || [],
      attractions: attractions || [],
      events: events || [],
      ticketNumber: ticketData?.ticketNumber,
      ticketType: ticketData?.ticketDetails?.orderType
    };
    console.log('📤 Sending request with data:', requestData);
    // МОКОВЫЕ ДАННЫЕ
    return getMockRouteData(to);
  } catch (error) {
    console.error("Error building route:", error);
    throw error;
  }
};

const getMockRouteData = (destination: string): RouteResponse => {
  if (destination.toLowerCase().includes("музей") || destination.toLowerCase().includes("пушкин")) {
    return {
    "visitPoints":
    [
        {
            "id": 2421978,
            "name": "Музей изобразительных искусств им. Пушкина",
            "latitude": 55.74726735,
            "longitude": 37.60518205,
            "category": "Музеи и галереи",
            "subcategory": "Музеи искусств",
            "square": 12570.119182615601,
            "estimatedVisitMinutes": 68,
            "osmType": "relation",
            "tags": [
            "addr:city=Москва",
            "addr:housenumber=12 с1",
            "addr:street=улица Волхонка",
            "building=museum",
            "building:architecture=neoclassicism",
            "building:colour=grey",
            "museum=art",
            "name=Музей изобразительных искусств им. Пушкина",
            "name:be=Дзяржаўны музей выяўленчых мастацтваў імя А. С. Пушкіна",
            "name:bg=Пушкински музей (Москва)",
            "name:ca=Museu de Belles Arts Puixkin",
            "name:de=Puschkin-Museum",
            "name:el=Μουσείο Πούσκιν",
            "name:en=The Pushkin State Museum of Fine Arts",
            "name:eo=Ŝtata Muzeo de Belartoj Puŝkin",
            "name:es=Museo Pushkin",
            "name:fr=Musée des beaux-arts Pouchkine",
            "name:he=מוזיאון פושקין",
            "name:hu=Puskin Múzeum",
            "name:it=Museo Puškin delle belle arti",
            "name:ja=プーシキン美術館",
            "name:ka=პუშკინის მუზეუმი (მოსკოვი)",
            "name:mk=Пушкински музеј",
            "name:nl=Poesjkinmuseum",
            "name:pl=Muzeum Sztuk Pięknych im. Puszkina w Moskwie",
            "name:pt=Museu Pushkin",
            "name:ru=Пушкинский музей",
            "name:sk=Puškinovo múzeum",
            "name:sr=Puškinov muzej",
            "name:uk=Державний музей образотворчих мистецтв імені О. С. Пушкіна",
            "name:vi=Bảo tàng Puskin",
            "name:zh=普希金造型藝術博物館",
            "phone=+7 495 6979578",
            "roof:material=metal",
            "start_date=1912",
            "tourism=museum",
            "type=multipolygon",
            "wikidata=Q4872",
            "wikipedia=ru:Государственный музей изобразительных искусств имени А. С. Пушкина"
            ]
        },
        {
            "id": 1543095,
            "name": "парк \"Новодевичьи пруды\"",
            "latitude": 55.72654145,
            "longitude": 37.55525995,
            "category": "Парки и сады",
            "subcategory": "Городские парки",
            "square": 506948.58416131686,
            "estimatedVisitMinutes": 60,
            "osmType": "relation",
            "tags": [
            "leisure=park",
            "name=парк \"Новодевичьи пруды\"",
            "name:zh=新圣女池公园",
            "type=multipolygon",
            "wikidata=Q21643516",
            "wikipedia=ru:Новодевичьи пруды"
            ]
        },
        {
            "id": 1555621,
            "name": "парк «Зарядье»",
            "latitude": 55.75093325,
            "longitude": 37.6290672,
            "category": "Парки и сады",
            "subcategory": "Городские парки",
            "square": 149627.52331851734,
            "estimatedVisitMinutes": 30,
            "osmType": "relation",
            "tags": [
            "contact:email=parkzaryadye@culture.mos.ru",
            "contact:phone=+7 495 5310500",
            "contact:website=https://www.zaryadyepark.ru/",
            "leisure=park",
            "name=парк «Зарядье»",
            "name:be=Парк Зараддзе",
            "name:de=Sarjadje-Park",
            "name:en=Zaryadye park",
            "name:ru=парк «Зарядье»",
            "name:zh=扎里亚季耶公园",
            "opening_hours=24/7",
            "type=multipolygon",
            "wikidata=Q19908995",
            "wikipedia=ru:Зарядье (парк)"
            ]
        }
    ],

    "sections":
    [
        {
            "gaps":
            [
                {
                    "startNode": 
                    {
                        "nodeId": 6732514847,
                        "name": "Метро «Кропоткинская»",
                        "latitude": 55.7447724,
                        "longitude": 37.6021373,
                        "role": "platform",
                        "sequence": 21
                    },
                    "transport" : "bus",
                    "routeNumber": "с755",
                    "endNode" : 
                    {
                        "nodeId": 2062599245,
                        "name": "Новодевичий монастырь",
                        "latitude": 55.7268739,
                        "longitude": 37.5595075,
                        "role": "platform",
                        "sequence": 31
                    },
                    "nodesVisited" : 
                    [
                        {
                            "nodeId": 2062604364,
                            "name": "Дом учёных",
                            "latitude": 55.7425849,
                            "longitude": 37.5956596,
                            "role": "platform",
                            "sequence": 22
                        },
                        {
                            "nodeId": 1927750442,
                            "name": "Академия художеств",
                            "latitude": 55.740735,
                            "longitude": 37.5913579,
                            "role": "platform",
                            "sequence": 23
                        },
                        {
                            "nodeId": 5320144986,
                            "name": "Пречистенка",
                            "latitude": 55.7391435,
                            "longitude": 37.5872775,
                            "role": "platform",
                            "sequence": 24
                        },
                        {
                            "nodeId": 2062601687,
                            "name": "Зубовская площадь",
                            "latitude": 55.7379289,
                            "longitude": 37.584378,
                            "role": "platform",
                            "sequence": 25
                        },
                        {
                            "nodeId": 2062601446,
                            "name": "Улица Льва Толстого",
                            "latitude": 55.7366594,
                            "longitude": 37.5815851,
                            "role": "platform",
                            "sequence": 26
                        },
                        {
                            "nodeId": 1251943516,
                            "name": "Институт биомедицины Пироговского Университета",
                            "latitude": 55.7347046,
                            "longitude": 37.5772815,
                            "role": "platform",
                            "sequence": 27
                        },
                        {
                            "nodeId": 1251943546,
                            "name": "Улица Еланского",
                            "latitude": 55.73367,
                            "longitude": 37.574928,
                            "role": "platform",
                            "sequence": 28
                        },
                        {
                            "nodeId": 2062599878,
                            "name": "Трубецкая улица",
                            "latitude": 55.7313635,
                            "longitude": 37.5696051,
                            "role": "platform",
                            "sequence": 29
                        },
                        {
                            "nodeId": 1250611563,
                            "name": "Абрикосовский переулок",
                            "latitude": 55.7290154,
                            "longitude": 37.5642226,
                            "role": "platform",
                            "sequence": 30
                        }
                    ]
                }
            ],

            "estimatedTimeInMinutes" : 30,
            "numberOfTransfers" : 0
        },

        {
            "gaps":
            [
                {
                    "startNode": 
                    {
                        "nodeId": 2062599311,
                        "name": "Новодевичий монастырь",
                        "latitude": 55.7274847,
                        "longitude": 37.5612651,
                        "role": "platform",
                        "sequence": 10
                    },
                    "transport" : "bus",
                    "routeNumber": "с755",
                    "endNode" : 
                    {
                        "nodeId": 5304828763,
                        "name": "Зарядье",
                        "latitude": 55.7497305,
                        "longitude": 37.6262996,
                        "role": "platform",
                        "sequence": 24
                    },
                    "nodesVisited" : 
                    [
                        {
                            "nodeId": 2062599353,
                            "name": "Абрикосовский переулок",
                            "latitude": 55.729727,
                            "longitude": 37.5664665,
                            "role": "platform",
                            "sequence": 11
                        },
                        {
                            "nodeId": 2062599367,
                            "name": "Трубецкая улица",
                            "latitude": 55.7318038,
                            "longitude": 37.57138,
                            "role": "platform",
                            "sequence": 12
                        },
                        {
                            "nodeId": 2062601053,
                            "name": "Улица Еланского",
                            "latitude": 55.7337943,
                            "longitude": 37.5758915,
                            "role": "platform",
                            "sequence": 13
                        },
                        {
                            "nodeId": 1251943494,
                            "name": "Институт биомедицины Пироговского Университета",
                            "latitude": 55.7353152,
                            "longitude": 37.5792343,
                            "role": "platform",
                            "sequence": 14
                        },
                        {
                            "nodeId": 1251943485,
                            "name": "Улица Льва Толстого",
                            "latitude": 55.7364706,
                            "longitude": 37.5818592,
                            "role": "platform",
                            "sequence": 15
                        },
                        {
                            "nodeId": 2062602072,
                            "name": "Зубовская площадь",
                            "latitude": 55.7379086,
                            "longitude": 37.5850474,
                            "role": "platform",
                            "sequence": 16
                        },
                        {
                            "nodeId": 10727802903,
                            "name": "Пречистенка",
                            "latitude": 55.7392628,
                            "longitude": 37.5880292,
                            "role": "platform",
                            "sequence": 17
                        },
                        {
                            "nodeId": 1927750440,
                            "name": "Академия художеств",
                            "latitude": 55.7400874,
                            "longitude": 37.5899737,
                            "role": "platform",
                            "sequence": 18
                        },
                        {
                            "nodeId": 2062604336,
                            "name": "Дом учёных",
                            "latitude": 55.7420756,
                            "longitude": 37.5949803,
                            "role": "platform",
                            "sequence": 19
                        },
                        {
                            "nodeId": 2062604382,
                            "name": "Метро «Кропоткинская»",
                            "latitude": 55.7443397,
                            "longitude": 37.6010716,
                            "role": "platform",
                            "sequence": 20
                        },
                        {
                            "nodeId": 1487452409,
                            "name": "Соймоновский проезд",
                            "latitude": 55.7435382,
                            "longitude": 37.6040696,
                            "role": "platform",
                            "sequence": 21
                        },
                        {
                            "nodeId": 5323901341,
                            "name": "Пречистенская набережная",
                            "latitude": 55.7440435,
                            "longitude": 37.6079117,
                            "role": "platform",
                            "sequence": 22
                        },
                        {
                            "nodeId": 1252999143,
                            "name": "Большой Каменный мост",
                            "latitude": 55.7475516,
                            "longitude": 37.6126407,
                            "role": "platform",
                            "sequence": 23
                        }
                    ]
                }
            ],

            "estimatedTimeInMinutes" : 30,
            "numberOfTransfers" : 0
        }
    ]
    };
  } else {
    return {
      visitPoints: [
        {
          id: 1785922,
          name: "Московский зоопарк",
          latitude: 55.7628076,
          longitude: 37.579976650000006,
          category: "Детские объекты",
          subcategory: "Зоопарки и аквариумы",
          square: 447117.0531250798,
          estimatedVisitMinutes: 180,
          osmType: "relation",
          tags: [
            "access=customers",
            "bicycle=no",
            "name=Московский зоопарк",
            "name:bg=Московски зоопарк",
            "name:da=Moskva Zoo",
            "name:de=Moskauer Zoo",
            "name:en=Moscow Zoo",
            "name:eo=Moskva Zoo",
            "name:es=Zoológico de Moscú",
            "name:et=Moskva loomaaed",
            "name:fa=باغ وحش مسکو",
            "name:fr=Parc zoologique de Moscou",
            "name:hr=Moskovski zološki vrt",
            "name:hu=Moszkvai Állatkert",
            "name:it=Zoo di Mosca",
            "name:ja=モスクワ動物園",
            "name:nl=Dierentuin van Moskou",
            "name:pl=Ogród zoologiczny w Moskwie",
            "name:ru=Московский зоопарк",
            "name:sv=Moskva Zoo",
            "name:uk=Московський зоопарк",
            "opening_hours=Tu-Su 10:00-19:00",
            "operator=ГАУ \"Московский зоопарк\"",
            "payment:cash=yes",
            "payment:maestro=yes",
            "payment:mastercard=yes",
            "payment:visa=yes",
            "payment:visa_electron=yes",
            "phone=+7 499 2522951;+7 499 2523580",
            "tourism=zoo",
            "type=multipolygon",
            "website=https://www.moscowzoo.ru/",
            "wheelchair=yes",
            "wikidata=Q613676",
            "wikipedia=ru:Московский зоопарк"
          ]
        },
        {
          id: 1907261,
          name: "Третьяковская галерея",
          latitude: 55.7413622,
          longitude: 37.62018155,
          category: "Музеи и галереи",
          subcategory: "Музеи искусств",
          square: 4399.417389913319,
          estimatedVisitMinutes: 120,
          osmType: "relation",
          tags: [
            "name=Третьяковская галерея",
            "opening_hours=10:00-18:00",
            "phone=+7 495 9570727",
            "type=multipolygon",
            "website=https://www.tretyakovgallery.ru/for-visitors/museums/tretyakovskaya-galereya/",
            "wikidata=Q183334",
            "wikipedia=ru:Государственная Третьяковская галерея",
          ]
        },
        {
          id: 1362325,
          name: "Александровский сад",
          latitude: 55.75163175,
          longitude: 37.61379725,
          category: "Парки и сады",
          subcategory: "Городские парки",
          square: 276788.0321942715,
          estimatedVisitMinutes: 30,
          osmType: "relation",
          tags: [
            "image=https://upload.wikimedia.org/wikipedia/commons/b/b7/Alexander_Garden_Gates.JPG",
            "int_name=Aleksandrovskiy sad",
            "leisure=park",
            "name=Александровский сад",
            "name:de=Alexandergarten",
            "name:en=Alexander Garden",
            "name:it=Giardini di Alessandro",
            "name:ml=അലക്സാണ്ടർ പൂന്തോട്ടം",
            "name:ru=Александровский сад",
            "name:sv=Alexanderträdgården",
            "name:vi=Vườn Aleksandr",
            "name:zh=亞歷山大花園",
            "type=multipolygon",
            "wikidata=Q1472498",
            "wikipedia=ru:Александровский сад (Москва)"
          ]
        }
      ],
      sections: [
        {
          gaps: [
            {
              startNode: {
                nodeId: 6937381516,
                name: "Краснопресненская",
                latitude: 55.7611984,
                longitude: 37.5771167,
                role: "stop",
                sequence: 1
              },
              transport: "metro",
              routeNumber: "5",
              endNode: {
                nodeId: 6937381522,
                name: "Октябрьская",
                latitude: 55.7296804,
                longitude: 37.6092907,
                role: "stop",
                sequence: 4
              },
              nodesVisited: [
                {
                  nodeId: 6937381518,
                  name: "Киевская",
                  latitude: 55.7447303,
                  longitude: 37.5653063,
                  role: "stop",
                  sequence: 2
                },
                {
                  nodeId: 6937381520,
                  name: "Парк Культуры",
                  latitude: 55.7357183,
                  longitude: 37.5911968,
                  role: "stop",
                  sequence: 3
                }
              ]
            }, 
            {
              startNode: {
                nodeId: 6938090621,
                name: "Октябрьская",
                latitude: 55.7304117,
                longitude: 37.6110074,
                role: "stop",
                sequence: 11
              },
              transport: "metro",
              routeNumber: "6",
              endNode: {
                nodeId: 6937811158,
                name: "Третьяковская",
                latitude: 55.7408133,
                longitude: 37.6271688,
                role: "stop",
                sequence: 12
              },
              nodesVisited: []
            }
          ],
          estimatedTimeInMinutes: 20,
          numberOfTransfers: 1
        },
        {
          gaps: [
            {
              startNode: {
                nodeId: 4291992600,
                name: "Большая Якиманка",
                latitude: 55.7399185,
                longitude: 37.6174054,
                role: "platform",
                sequence: 12
              },
              transport: "bus",
              routeNumber: "м9",
              endNode: {
                nodeId: 1211022737,
                name: "Метро «Библиотека имени Ленина»",
                latitude: 55.752885,
                longitude: 37.6115674,
                role: "platform",
                sequence: 14
              },
              nodesVisited: [
                {
                  nodeId: 1421370319,
                  name: "Болотная площадь",
                  latitude: 55.7438324,
                  longitude: 37.6150144,
                  role: "platform",
                  sequence: 13
                }
              ]
            }
          ],
          estimatedTimeInMinutes: 5,
          numberOfTransfers: 0
        }
      ]
    };
  }
};

export const getPlacesAlongRoute = (routeId: string) =>
  api.get(`/places?routeId=${routeId}`);

export const getEventsInCity = (city: string) =>
  api.get(`/events?city=${city}`);
