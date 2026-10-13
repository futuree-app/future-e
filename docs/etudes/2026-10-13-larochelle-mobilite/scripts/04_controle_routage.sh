#!/bin/sh
# 04_controle_routage.sh — Rejoue les itinéraires suspects du mini-échantillon (13/10/2026) avec plusieurs calculs.
# IGN Géoplateforme /navigation/itineraire (bdtopo-valhalla fastest = paramètres du produit, route-time.ts ;
# bdtopo-valhalla shortest ; bdtopo-osrm) et OSRM FOSSGIS sur OSM (routing.openstreetmap.de, voiture/pied/vélo).
# Usage : sh 04_controle_routage.sh <dossier de sortie>
O=${1:-.}
EU="-1.179682,46.166611"; GARE="-1.14529,46.1527"; SM="-1.18059,46.1672"  # place de l'Europe ; gare (point BPE) ; supermarché BPE le plus proche
IGN="https://data.geopf.fr/navigation/itineraire?timeUnit=minute&distanceUnit=meter&geometryFormat=geojson&getSteps=true"
curl -sS "$IGN&resource=bdtopo-valhalla&optimization=fastest&profile=car&start=$EU&end=$GARE" -o "$O/europe_gare_car.json"
curl -sS "$IGN&resource=bdtopo-valhalla&optimization=shortest&profile=car&start=$EU&end=$GARE" -o "$O/eg_car_short.json"
curl -sS "$IGN&resource=bdtopo-osrm&optimization=fastest&profile=car&start=$EU&end=$GARE" -o "$O/eg_car_osrm_ign.json"
curl -sS "$IGN&resource=bdtopo-valhalla&optimization=fastest&profile=pedestrian&start=$EU&end=$GARE" -o "$O/europe_gare_walk.json"
curl -sS "$IGN&resource=bdtopo-valhalla&optimization=fastest&profile=pedestrian&start=$EU&end=$SM" -o "$O/eu_sm_walk.json"
UA="futur-e-etude/1.0"
curl -sS -A "$UA" "https://routing.openstreetmap.de/routed-car/route/v1/driving/$EU;$GARE?overview=false&steps=true" -o "$O/eg_osm_driving.json"
curl -sS -A "$UA" "https://routing.openstreetmap.de/routed-foot/route/v1/foot/$EU;$GARE?overview=false&steps=true" -o "$O/eg_osm_foot.json"
curl -sS -A "$UA" "https://routing.openstreetmap.de/routed-bike/route/v1/bike/$EU;$GARE?overview=false&steps=true" -o "$O/eg_osm_bike.json"
curl -sS -A "$UA" "https://routing.openstreetmap.de/routed-foot/route/v1/foot/$EU;$SM?overview=false&steps=true" -o "$O/eu_sm_osm.json"
