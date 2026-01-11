#!/bin/bash
# Download remaining paintings using curl with proper headers

# Get the script directory and navigate to project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/../src/assets/paintings"

# Function to download with retries
download() {
    local url="$1"
    local output="$2"

    if [ -f "$output" ] && [ $(stat -c%s "$output") -gt 1000 ]; then
        echo "✓ Already exists: $output"
        return 0
    fi

    echo "Downloading: $output..."
    curl -L -f -s -o "$output" \
        -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
        -H "Accept: image/*" \
        -H "Referer: https://en.wikipedia.org/" \
        "$url"

    if [ $? -eq 0 ] && [ -f "$output" ] && [ $(stat -c%s "$output") -gt 1000 ]; then
        echo "✓ Downloaded: $output"
        return 0
    else
        echo "✗ Failed: $output"
        rm -f "$output"
        return 1
    fi
}

# Download with 3 second delays between each
download 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/800px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg' 'mona_lisa.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg/800px-Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg' 'the_scream.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/en/7/74/Guernica.jpg' 'guernica.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Klimt_-_Der_Kuss.jpeg/800px-Klimt_-_Der_Kuss.jpeg' 'the_kiss.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Las_Meninas%2C_by_Diego_Vel%C3%A1zquez%2C_from_Prado_in_Google_Earth.jpg/800px-Las_Meninas%2C_by_Diego_Vel%C3%A1zquez%2C_from_Prado_in_Google_Earth.jpg' 'las_meninas.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Van_Eyck_-_Arnolfini_Portrait.jpg/800px-Van_Eyck_-_Arnolfini_Portrait.jpg' 'the_arnolfini_portrait.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/en/9/95/Campbell%27s_Soup_Cans_MOMA.jpg' 'campbell_s_soup_cans.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0a/Frida_Kahlo_-_The_Two_Fridas.jpg/800px-Frida_Kahlo_-_The_Two_Fridas.jpg' 'the_two_fridas.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Henri_Rousseau_-_La_Boh%C3%A9mienne_endormie.jpg/1280px-Henri_Rousseau_-_La_Boh%C3%A9mienne_endormie.jpg' 'the_sleeping_gypsy.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Vincent_Willem_van_Gogh_-_Cafe_Terrace_at_Night_%28Yorck%29.jpg/800px-Vincent_Willem_van_Gogh_-_Cafe_Terrace_at_Night_%28Yorck%29.jpg' 'cafe_terrace_at_night.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Vincent_Willem_van_Gogh_127.jpg/800px-Vincent_Willem_van_Gogh_127.jpg' 'sunflowers.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/John_Constable_-_The_Hay_Wain_%281821%29.jpg/1280px-John_Constable_-_The_Hay_Wain_%281821%29.jpg' 'the_hay_wain.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Auguste_Renoir_-_Dance_at_Le_Moulin_de_la_Galette_-_Google_Art_Project.jpg/1280px-Auguste_Renoir_-_Dance_at_Le_Moulin_de_la_Galette_-_Google_Art_Project.jpg' 'dance_at_le_moulin_de_la_galette.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Fragonard%2C_The_Swing.jpg/800px-Fragonard%2C_The_Swing.jpg' 'the_swing.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Francisco_de_Goya%2C_Saturno_devorando_a_su_hijo_%281819-1823%29.jpg/800px-Francisco_de_Goya%2C_Saturno_devorando_a_su_hijo_%281819-1823%29.jpg' 'saturn_devouring_his_son.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg/800px-Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg' 'wanderer_above_the_sea_of_fog.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/%C3%89douard_Manet_-_Le_D%C3%A9jeuner_sur_l%27herbe.jpg/1280px-%C3%89douard_Manet_-_Le_D%C3%A9jeuner_sur_l%27herbe.jpg' 'le_dejeuner_sur_l_herbe.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Gustav_Klimt_046.jpg/800px-Gustav_Klimt_046.jpg' 'portrait_of_adele_bloch_bauer_i.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Vassily_Kandinsky%2C_1923_-_Composition_8%2C_huile_sur_toile%2C_140_cm_x_201_cm%2C_Mus%C3%A9e_Guggenheim%2C_New_York.jpg/1280px-Vassily_Kandinsky%2C_1923_-_Composition_8%2C_huile_sur_toile%2C_140_cm_x_201_cm%2C_Mus%C3%A9e_Guggenheim%2C_New_York.jpg' 'composition_viii.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Piet_Mondrian%2C_1942_-_Broadway_Boogie_Woogie.jpg/800px-Piet_Mondrian%2C_1942_-_Broadway_Boogie_Woogie.jpg' 'broadway_boogie_woogie.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/A_Friend_in_Need_1903_C.M.Coolidge.jpg/1280px-A_Friend_in_Need_1903_C.M.Coolidge.jpg' 'dogs_playing_poker.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Rodin_-_The_Thinker_-_2.jpg/800px-Rodin_-_The_Thinker_-_2.jpg' 'the_thinker.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/%27David%27_by_Michelangelo_JBU0001.JPG/800px-%27David%27_by_Michelangelo_JBU0001.JPG' 'david.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Venus_de_Milo_Louvre_Ma399_n4.jpg/800px-Venus_de_Milo_Louvre_Ma399_n4.jpg' 'venus_de_milo.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/en/0/05/Girl_before_a_Mirror.jpg' 'girl_before_a_mirror.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Portrait_of_Dr._Gachet.jpg/800px-Portrait_of_Dr._Gachet.jpg' 'portrait_of_dr_gachet.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/en/0/0f/Blue_Poles_%28Jackson_Pollock_painting%29.jpg' 'blue_poles.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/en/a/a2/Christina%27s_World.jpg' 'christina_s_world.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/en/b/b9/MagrittePipe.jpg' 'the_treachery_of_images.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/David_-_Napoleon_crossing_the_Alps_-_Malmaison2.jpg/800px-David_-_Napoleon_crossing_the_Alps_-_Malmaison2.jpg' 'napoleon_crossing_the_alps.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Rembrandt_van_Rijn_-_Self-Portrait_-_Google_Art_Project.jpg/800px-Rembrandt_van_Rijn_-_Self-Portrait_-_Google_Art_Project.jpg' 'self_portrait.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Turner_-_Rain%2C_Steam_and_Speed_-_National_Gallery_file.jpg/1280px-Turner_-_Rain%2C_Steam_and_Speed_-_National_Gallery_file.jpg' 'rain_steam_and_speed.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Claude_Monet_-_Water_Lilies_and_Japanese_Bridge.jpg/1280px-Claude_Monet_-_Water_Lilies_and_Japanese_Bridge.jpg' 'water_lilies_and_japanese_bridge.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Edgar_Degas_-_The_Ballet_Class_-_Google_Art_Project.jpg/800px-Edgar_Degas_-_The_Ballet_Class_-_Google_Art_Project.jpg' 'the_ballet_class.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Piet_Mondriaan%2C_1930_-_Mondrian_Composition_II_in_Red%2C_Blue%2C_and_Yellow.jpg/800px-Piet_Mondriaan%2C_1930_-_Mondrian_Composition_II_in_Red%2C_Blue%2C_and_Yellow.jpg' 'composition_with_red_blue_and_yellow.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Claude_Monet_-_Woman_with_a_Parasol_-_Madame_Monet_and_Her_Son_-_Google_Art_Project.jpg/800px-Claude_Monet_-_Woman_with_a_Parasol_-_Madame_Monet_and_Her_Son_-_Google_Art_Project.jpg' 'woman_with_a_parasol.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg/800px-Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg' 'the_milkmaid.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Jan_Vermeer_van_Delft_-_Girl_with_a_Red_Hat_-_Google_Art_Project.jpg/800px-Jan_Vermeer_van_Delft_-_Girl_with_a_Red_Hat_-_Google_Art_Project.jpg' 'the_girl_with_the_red_hat.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Death_of_Marat_by_David.jpg/800px-Death_of_Marat_by_David.jpg' 'the_death_of_marat.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Paul_C%C3%A9zanne_-_Les_Joueurs_de_cartes.jpg/1280px-Paul_C%C3%A9zanne_-_Les_Joueurs_de_cartes.jpg' 'the_card_players.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Paul_C%C3%A9zanne_-_Mont_Sainte-Victoire_Seen_from_the_Bibemus_Quarry_%28Baltimore%29.jpg/1280px-Paul_C%C3%A9zanne_-_Mont_Sainte-Victoire_Seen_from_the_Bibemus_Quarry_%28Baltimore%29.jpg' 'mont_sainte_victoire.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Paul_Gauguin_-_D%27ou_Venons_Nous.jpg/1280px-Paul_Gauguin_-_D%27ou_Venons_Nous.jpg' 'where_do_we_come_from.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Paul_Gauguin_-_Deux_Tahitiennes.jpg/800px-Paul_Gauguin_-_Deux_Tahitiennes.jpg' 'two_tahitian_women.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/At_the_Moulin_Rouge_-_Google_Art_Project.jpg/1280px-At_the_Moulin_Rouge_-_Google_Art_Project.jpg' 'at_the_moulin_rouge.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/en/a/a7/Matissedance.jpg' 'the_dance.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/en/f/fc/The_Red_Studio.jpg' 'the_red_studio.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/en/6/61/The_Snail.jpg' 'the_snail.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Malevich.black-square.jpg/800px-Malevich.black-square.jpg' 'black_square.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/en/f/f5/The_Elephants.jpg' 'the_elephants.jpg'
sleep 3

download 'https://upload.wikimedia.org/wikipedia/en/0/0e/SwansReflectingElephants.jpg' 'swans_reflecting_elephants.jpg'

echo ""
echo "=== Download complete ==="
echo "Total files:"
ls -la | wc -l
