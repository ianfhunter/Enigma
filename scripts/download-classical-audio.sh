#!/bin/bash
# Downloads public domain classical music recordings from Internet Archive
# Collection: 100ClassicalMusicMasterpieces
# Usage: ./scripts/download-classical-audio.sh

OUTPUT_DIR="public/audio/classical"
BASE_URL="https://archive.org/download/100ClassicalMusicMasterpieces"
mkdir -p "$OUTPUT_DIR"

echo "🎵 Downloading classical music audio files..."
echo "   Source: Internet Archive - 100 Classical Music Masterpieces"
echo ""

# Function to download with proper filename
download() {
    local num=$1
    local source_file=$2
    local filename=$(printf "%02d.ogg" "$num")

    # URL encode the filename (spaces become %20)
    local encoded_file=$(echo "$source_file" | sed 's/ /%20/g')
    local url="${BASE_URL}/${encoded_file}"

    printf "  [%02d/50] Downloading %s... " "$num" "$filename"

    if curl -sL --connect-timeout 10 --max-time 180 -o "$OUTPUT_DIR/$filename" "$url" 2>/dev/null; then
        local size=$(stat -c%s "$OUTPUT_DIR/$filename" 2>/dev/null || stat -f%z "$OUTPUT_DIR/$filename" 2>/dev/null)
        if [ "$size" -gt 50000 ]; then
            local size_h=$(numfmt --to=iec-i --suffix=B $size 2>/dev/null || echo "${size}B")
            echo "✓ ($size_h)"
            return 0
        else
            echo "✗ (too small: ${size}B)"
            rm -f "$OUTPUT_DIR/$filename"
            return 1
        fi
    else
        echo "✗ (download failed)"
        return 1
    fi
}

# Map our quiz pieces to the archive.org collection
# Format: download NUMBER "archive_filename.ogg"

# Beethoven Symphony No. 5
download 1 "1808 Beethoven- Symphony No. 5, 1st movement.ogg"

# Für Elise
download 2 "1810 Beethoven- Fur Elise.ogg"

# Eine kleine Nachtmusik
download 3 "1787 Eine Kleine Nachtmusik, 1st movement.ogg"

# Mozart Symphony No. 40
download 4 "1788 Mozart- Symphony No. 40, 1st movement.ogg"

# Vivaldi Spring
download 5 "1725 Vivaldi , The Four Seasons - Spring.ogg"

# Vivaldi Winter (use Vivaldi La Notte as substitute)
download 6 "1731 Vivaldi , Flute Concerto in G minor 'La Notte', VI. Allegro.ogg"

# Bach Toccata and Fugue
download 7 "1709 Bach , Toccata in D minor.ogg"

# Bach Cello Suite (use Bach Oboe Concerto as substitute)
download 8 "1731 Bach , Oboe Concerto in D minor, 2nd movement.ogg"

# Pachelbel Canon
download 9 "1698 Pachelbel , Canon in D.ogg"

# Wagner Ride of the Valkyries
download 10 "1870 Wagner- Ride of the Valkyries; from 'The Valkyrie'.ogg"

# Strauss Blue Danube
download 11 "1867 J. Strauss II- The Blue Danube - Waltz.ogg"

# Liszt Hungarian Rhapsody No. 2
download 12 "1847 Liszt- Hungarian Rhapsody No.2.ogg"

# Beethoven Moonlight Sonata
download 13 "1801 Beethoven- 'Moonlight' Sonata, 1st movement.ogg"

# Beethoven Ode to Joy (use Beethoven Minuet as substitute - same composer for quiz)
download 14 "1796 Beethoven- Minuet in G.ogg"

# Grieg In the Hall of the Mountain King (use Grieg Last Spring)
download 15 "1886 Grieg- The Last Spring.ogg"

# Grieg Morning Mood
download 16 "1876 Grieg- Morning, from 'Peer Gynt'.ogg"

# Tchaikovsky Swan Lake (use Sleeping Beauty)
download 17 "1889 Tchaikovsky- The Sleeping Beauty - Introduction.ogg"

# Tchaikovsky Dance of the Sugar Plum Fairy (use Waltz of the Flowers)
download 18 "1892 Tchaikovsky- Waltz of the FLowers, from 'The Nutcracker'.ogg"

# Tchaikovsky 1812 Overture (use Marche Slave)
download 19 "1876 Tchaikovsky- Marche Slave, Op. 31.ogg"

# Tchaikovsky Piano Concerto No. 1
download 20 "1875 Tchaikovsky- Piano Concerto No. 1 in B flat minor, 1st movement (excerpt).ogg"

# Chopin Nocturne (use Chopin Polonaise)
download 21 "1838 Chopin - Polonaise in A, Op.40 No.3, 'Military'.ogg"

# Chopin Minute Waltz (use Brahms Waltz as substitute)
download 22 "1865 Brahms- Waltz.ogg"

# Debussy Clair de Lune (use Delibes Notturno - similar dreamy style)
download 23 "1870 Delibes- Notturno, from 'Coppelia'.ogg"

# Debussy Prelude (use Offenbach Barcarolle)
download 24 "1864 Offenbach- Barcarolle, from 'The Tales of Hoffmann'.ogg"

# Ravel Bolero
download 25 "1928 Ravel - Bolero.ogg"

# Rossini William Tell Overture (use Suppe Light Cavalry)
download 26 "1866 Suppe- Light Cavalry-Overture.ogg"

# Rossini Barber of Seville
download 27 "1821 Rossini - The Barber Of Seville - Overture.ogg"

# Bizet Habanera (use Bizet Les Toreadors)
download 28 "1875 Bizet- Les Toreadors, from 'Carmen'.ogg"

# R. Strauss Also sprach Zarathustra
download 29 "1896 R. Strauss - Also sprach Zarathustra - Fanfare.ogg"

# Schubert Ave Maria
download 30 "1825 Schubert - Ave Maria.ogg"

# Schubert Symphony Unfinished
download 31 "1822 Schubert - Symphony No.8 in B minor, 'Unfinished'.ogg"

# Rachmaninoff (use Rubinstein Melody in F as substitute)
download 32 "1858 Rubinstein- Melody in F.ogg"

# Mahler Symphony No. 5 Adagietto
download 33 "1902 Mahler - Symphony No. 5 - Adagietto.ogg"

# Holst Mars (use Sibelius Finlandia as dramatic substitute)
download 34 "1899 Sibelius - Finlandia.ogg"

# Holst Jupiter (use Elgar Pomp and Circumstance - similar grand style)
download 35 "1901 Elgar - Pomp and Circumstance - March No. 1.ogg"

# Orff O Fortuna (use Wagner Siegfried's Death - dramatic)
download 36 "1877 Wagner- Siegfried's Death and Funeral March; from 'Twilight of the Gods'.ogg"

# Verdi Dies Irae (use Verdi Nabucco Overture)
download 37 "1842 Verdi - Nabucco - Overture.ogg"

# Verdi La donna è mobile (use Verdi La Traviata)
download 38 "1853 Verdi- La Traviata - Prelude to Act 1.ogg"

# Puccini Nessun dorma (use Massenet Meditation - operatic style)
download 39 "1894 Massenet - Meditation, from 'Thais'.ogg"

# Bach Air on G String
download 40 "1727 Bach , Air (from Orchestral Suite No. 3 in D).ogg"

# Bach Brandenburg Concerto No. 3
download 41 "1721 Bach , Brandenburg Concerto No. 3, 1st movement.ogg"

# Handel Hallelujah
download 42 "1742 Handel , 'Hallelujah' (from 'Messiah').ogg"

# Handel Water Music
download 43 "1717 Handel , Water Music, Suite No. 2 in D.ogg"

# Brahms Hungarian Dance (use Dvorak Slavonic Dance)
download 44 "1886 Dvorak - Slavonic Dance No. 2.ogg"

# Dvorak New World Symphony Largo
download 45 "1893 Dvorak- Symphony No. 9, 'From the New World', 2nd Movement.ogg"

# Dukas Sorcerer's Apprentice (use Rimsky-Korsakov Flight of the Bumblebee)
download 46 "1900 Rimsky-Korsakov - Dance of the Bumble Bee.ogg"

# Stravinsky Rite of Spring (use Smetana The Moldau)
download 47 "1875 Smetana- The Moldau.ogg"

# Stravinsky Firebird (use Smetana Bartered Bride)
download 48 "1866 Smetna- The Bartered Bride - Overture.ogg"

# Prokofiev Peter and Wolf (use Liszt Les Preludes)
download 49 "1854 Liszt- Les Preludes.ogg"

# Prokofiev Dance of the Knights (use Wagner Lohengrin)
download 50 "1850 Wagner - Lohengin - Prelude to Act 3.ogg"

echo ""
echo "✅ Download complete!"
echo ""

# Count successful downloads
count=$(ls -1 "$OUTPUT_DIR"/*.ogg 2>/dev/null | grep -c .)
echo "📊 $count/50 audio files downloaded"
echo ""

if [ "$count" -lt 50 ]; then
    echo "⚠️  Some files may have failed. Check the output above for errors."
fi

# Show disk usage
du -sh "$OUTPUT_DIR" 2>/dev/null | awk '{print "💾 Total size: " $1}'
