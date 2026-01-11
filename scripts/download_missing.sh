#!/bin/bash
# Download missing paintings - with longer delays and updated URLs

cd /home/ian/splash/selfhost_games/src/assets/paintings

download() {
    local url="$1"
    local output="$2"

    if [ -f "$output" ] && [ $(stat -c%s "$output") -gt 1000 ]; then
        echo "✓ Already exists: $output"
        return 0
    fi

    echo "Downloading: $output..."
    curl -L -f -s -o "$output" \
        -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
        -H "Accept: image/avif,image/webp,image/apng,image/*,*/*;q=0.8" \
        -H "Referer: https://commons.wikimedia.org/" \
        --retry 3 \
        --retry-delay 5 \
        "$url"

    if [ $? -eq 0 ] && [ -f "$output" ] && [ $(stat -c%s "$output") -gt 1000 ]; then
        echo "✓ Downloaded: $output"
        return 0
    else
        echo "✗ Failed: $output"
        rm -f "$output" 2>/dev/null
        return 1
    fi
}

echo "=== Downloading public domain works from Wikimedia Commons ==="
echo ""

# Public domain works that were rate-limited (with 5 second delays)
download 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Henri_Rousseau_-_La_Boh%C3%A9mienne_endormie.jpg/1280px-Henri_Rousseau_-_La_Boh%C3%A9mienne_endormie.jpg' 'the_sleeping_gypsy.jpg'
sleep 5

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Vincent_Willem_van_Gogh_-_Cafe_Terrace_at_Night_%28Yorck%29.jpg/800px-Vincent_Willem_van_Gogh_-_Cafe_Terrace_at_Night_%28Yorck%29.jpg' 'cafe_terrace_at_night.jpg'
sleep 5

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/John_Constable_-_The_Hay_Wain_%281821%29.jpg/1280px-John_Constable_-_The_Hay_Wain_%281821%29.jpg' 'the_hay_wain.jpg'
sleep 5

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Auguste_Renoir_-_Dance_at_Le_Moulin_de_la_Galette_-_Google_Art_Project.jpg/1280px-Auguste_Renoir_-_Dance_at_Le_Moulin_de_la_Galette_-_Google_Art_Project.jpg' 'dance_at_le_moulin_de_la_galette.jpg'
sleep 5

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Van_Eyck_-_Arnolfini_Portrait.jpg/800px-Van_Eyck_-_Arnolfini_Portrait.jpg' 'the_arnolfini_marriage.jpg'
sleep 5

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/%C3%89douard_Manet_-_Le_D%C3%A9jeuner_sur_l%27herbe.jpg/1280px-%C3%89douard_Manet_-_Le_D%C3%A9jeuner_sur_l%27herbe.jpg' 'le_dejeuner_sur_l_herbe.jpg'
sleep 5

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Vassily_Kandinsky%2C_1923_-_Composition_8%2C_huile_sur_toile%2C_140_cm_x_201_cm%2C_Mus%C3%A9e_Guggenheim%2C_New_York.jpg/1280px-Vassily_Kandinsky%2C_1923_-_Composition_8%2C_huile_sur_toile%2C_140_cm_x_201_cm%2C_Mus%C3%A9e_Guggenheim%2C_New_York.jpg' 'composition_viii.jpg'
sleep 5

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/A_Friend_in_Need_1903_C.M.Coolidge.jpg/1280px-A_Friend_in_Need_1903_C.M.Coolidge.jpg' 'dogs_playing_poker.jpg'
sleep 5

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Rodin_-_The_Thinker_-_2.jpg/800px-Rodin_-_The_Thinker_-_2.jpg' 'the_thinker.jpg'
sleep 5

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/%27David%27_by_Michelangelo_JBU0001.JPG/800px-%27David%27_by_Michelangelo_JBU0001.JPG' 'david.jpg'
sleep 5

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Venus_de_Milo_Louvre_Ma399_n4.jpg/800px-Venus_de_Milo_Louvre_Ma399_n4.jpg' 'venus_de_milo.jpg'
sleep 5

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Turner_-_Rain%2C_Steam_and_Speed_-_National_Gallery_file.jpg/1280px-Turner_-_Rain%2C_Steam_and_Speed_-_National_Gallery_file.jpg' 'rain_steam_and_speed.jpg'
sleep 5

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Claude_Monet_-_Water_Lilies_and_Japanese_Bridge.jpg/1280px-Claude_Monet_-_Water_Lilies_and_Japanese_Bridge.jpg' 'water_lilies_and_japanese_bridge.jpg'
sleep 5

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Edgar_Degas_-_The_Ballet_Class_-_Google_Art_Project.jpg/800px-Edgar_Degas_-_The_Ballet_Class_-_Google_Art_Project.jpg' 'the_ballet_class.jpg'
sleep 5

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Jan_Vermeer_van_Delft_-_Girl_with_a_Red_Hat_-_Google_Art_Project.jpg/800px-Jan_Vermeer_van_Delft_-_Girl_with_a_Red_Hat_-_Google_Art_Project.jpg' 'the_girl_with_the_red_hat.jpg'
sleep 5

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Paul_C%C3%A9zanne_-_Les_Joueurs_de_cartes.jpg/1280px-Paul_C%C3%A9zanne_-_Les_Joueurs_de_cartes.jpg' 'the_card_players.jpg'
sleep 5

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Paul_C%C3%A9zanne_-_Mont_Sainte-Victoire_Seen_from_the_Bibemus_Quarry_%28Baltimore%29.jpg/1280px-Paul_C%C3%A9zanne_-_Mont_Sainte-Victoire_Seen_from_the_Bibemus_Quarry_%28Baltimore%29.jpg' 'mont_sainte_victoire.jpg'
sleep 5

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Paul_Gauguin_-_D%27ou_Venons_Nous.jpg/1280px-Paul_Gauguin_-_D%27ou_Venons_Nous.jpg' 'where_do_we_come_from.jpg'
sleep 5

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Paul_Gauguin_-_Deux_Tahitiennes.jpg/800px-Paul_Gauguin_-_Deux_Tahitiennes.jpg' 'two_tahitian_women.jpg'
sleep 5

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/At_the_Moulin_Rouge_-_Google_Art_Project.jpg/1280px-At_the_Moulin_Rouge_-_Google_Art_Project.jpg' 'at_the_moulin_rouge.jpg'
sleep 5

echo ""
echo "=== Now trying newly public domain works (Matisse died 1954, PD 2025) ==="
echo ""

# Matisse - try Commons URLs (now PD as of 2025)
download 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/La_danse_%28I%29_by_Matisse.jpg/1280px-La_danse_%28I%29_by_Matisse.jpg' 'the_dance.jpg'
sleep 5

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/The_Red_Studio.jpg/1280px-The_Red_Studio.jpg' 'the_red_studio.jpg'
sleep 5

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Matisse_-_The_Snail.jpg/800px-Matisse_-_The_Snail.jpg' 'the_snail.jpg'
sleep 5

echo ""
echo "=== Trying Frida Kahlo (died 1954, PD 2025) ==="
echo ""

download 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Frida_Kahlo_-_The_Two_Fridas_-_Google_Art_Project.jpg/800px-Frida_Kahlo_-_The_Two_Fridas_-_Google_Art_Project.jpg' 'the_two_fridas.jpg'
sleep 5

echo ""
echo "=== Summary ==="
echo "Total images now:"
ls -1 *.jpg *.jpeg *.png 2>/dev/null | wc -l
