import { useState, useMemo } from "react";

const DB = {
  families: ["Terres & Banco","Textiles Royaux","Côtier Swahili","Géométrique Peint","Sauvage & Nomade","Islamique Africain","Tropical Équatorial","Urbain Contemporain"],
  regions: ["Afrique du Nord","Afrique de l'Ouest","Afrique Centrale","Afrique de l'Est","Afrique Australe"],
  styles: [
    { id:"ma-riad", name:"Riad Traditionnel", country:"Maroc", flag:"🇲🇦", region:"Afrique du Nord", family:"Islamique Africain", colors:["#C17D3C","#1A5276","#F9F6EE","#2E86C1","#922B21"], materials:["zellige","stuc ciselé","bois de cèdre","fontaine marbre","mosaïque"], patterns:["étoiles géométriques","arabesques","calligraphie arabe"], prompt:"traditional Moroccan riad interior, zellige tile floors, carved cedar ceiling, Moorish arches, blue gold palette, luxury photography", description:"Cours intérieures, zellige coloré, fontaines murmurantes — l'art de vivre andalou-berbère" },
    { id:"ma-berbere", name:"Berbère Moderne", country:"Maroc", flag:"🇲🇦", region:"Afrique du Nord", family:"Sauvage & Nomade", colors:["#F5F0E8","#8B7355","#D4A853","#2C2C2C","#C4956A"], materials:["tapis Beni Ouarain","laine naturelle","cuir tanné","bois d'argan","poterie"], patterns:["losanges géométriques","symboles Amazigh","lignes brisées"], prompt:"Berber modern interior, Beni Ouarain wool rug, geometric diamond patterns, Atlas mountains, neutral warm palette, organic minimalist", description:"Tapis Beni Ouarain à losanges, laine brute et symboles Amazigh dans un écrin épuré" },
    { id:"ma-gnaoua", name:"Gnaoua Soul", country:"Maroc", flag:"🇲🇦", region:"Afrique du Nord", family:"Islamique Africain", colors:["#1A237E","#B71C1C","#F57F17","#1B5E20","#212121"], materials:["cuivre gravé","cuir tanné","indigo Marrakech","bois thuya","métal"], patterns:["étoiles 8 branches","triangles imbriqués","entrelacs"], prompt:"Gnaoua Moroccan interior, deep indigo copper accents, ritual atmosphere, brass lanterns, dark wood, ceremonial textiles, moody dramatic", description:"Indigo profond, cuivre martelé et rituels de guérison — l'âme africaine du Maghreb" },
    { id:"ma-atlas", name:"Atlas Nomade", country:"Maroc", flag:"🇲🇦", region:"Afrique du Nord", family:"Sauvage & Nomade", colors:["#8B0000","#D4AC0D","#4A235A","#F5CBA7","#2C3E50"], materials:["laine tente caïdale","lanières cuir","broderies soie","tapis de selle","osier"], patterns:["bandes horizontales","franges et pompons","broderies florales"], prompt:"Moroccan Atlas nomadic tent interior, tribal wool, leather poufs, burgundy gold palette, mountain camping luxury, bohemian style", description:"Tentes caïdales, lanières de cuir et broderies de montagne — le luxe nomade de l'Atlas" },
    { id:"tn-sidibousaid", name:"Sidi Bou Saïd", country:"Tunisie", flag:"🇹🇳", region:"Afrique du Nord", family:"Islamique Africain", colors:["#FFFFFF","#1565C0","#F5F5DC","#FFD700","#87CEEB"], materials:["fer forgé bleu","carrelage blanc","bois peint","faïence tunisienne","marbre"], patterns:["treilles en bois","mashrabiya","étoiles 6 branches"], prompt:"Sidi Bou Said Tunisian interior, cobalt blue white, iron grille windows, Mediterranean terrace, ceramic tiles, bright daylight", description:"Bleu cobalt et blanc, treilles en fer forgé — la Méditerranée africaine dans toute sa pureté" },
    { id:"eg-pharaon", name:"Pharaonique Revisité", country:"Égypte", flag:"🇪🇬", region:"Afrique du Nord", family:"Islamique Africain", colors:["#D4AF37","#000080","#C41E3A","#F5F5DC","#2F4F4F"], materials:["or","lapis-lazuli","lin naturel","granit noir","albâtre"], patterns:["hiéroglyphes","scarabées","œil d'Horus","lotus"], prompt:"Egyptian pharaonic inspired interior, gold hieroglyphics dark walls, lapis lazuli accents, linen textiles, alabaster lighting, dramatic shadows", description:"Hiéroglyphes en or, lin naturel et lapis-lazuli — l'Égypte ancienne pour le luxe contemporain" },
    { id:"eg-nubie", name:"Nubie Colorée", country:"Égypte", flag:"🇪🇬", region:"Afrique du Nord", family:"Géométrique Peint", colors:["#FF6B35","#004E89","#F7C59F","#1A936F","#FFD166"], materials:["argile peinte","palmier doum","nattes tressées","tissu coton peint","poteries"], patterns:["scènes de vie peintes","crocodiles stylisés","oiseaux du Nil"], prompt:"Nubian colorful interior, hand painted walls vibrant scenes, turquoise orange color scheme, palm wood furniture, Upper Egypt village style", description:"Façades peintes de scènes de vie, bleu turquoise et orange — la joie de vivre nubienne" },
    { id:"sn-teranga", name:"Dakar Teranga", country:"Sénégal", flag:"🇸🇳", region:"Afrique de l'Ouest", family:"Textiles Royaux", colors:["#FF8C00","#228B22","#FFD700","#8B0000","#F5DEB3"], materials:["tissu Manjak","raphia","bois de vène","fer forgé coloré","coton wax"], patterns:["Manjak tissé","broderies wolof","motifs de pêche"], prompt:"Dakar Senegalese teranga interior, vibrant Manjak woven textiles, African hospitality, colorful fabrics, vene wood furniture, Atlantic coast", description:"Tissus Manjak vibrants, hospitalité légendaire — l'art de vivre sénégalais" },
    { id:"sn-casamance", name:"Casamance Diola", country:"Sénégal", flag:"🇸🇳", region:"Afrique de l'Ouest", family:"Tropical Équatorial", colors:["#2D5016","#8B4513","#F5DEB3","#4682B4","#228B22"], materials:["bois de vène","chaume","bambou Casamance","raphia","argile locale"], patterns:["nattes Diola","tressage bambou","motifs calebasse"], prompt:"Casamance Diola interior, impluvium house architecture, natural vene wood, bamboo, thatch roof, lush tropical, river blue accents, soft light", description:"Cases à impluvium, bois de vène et bambou — la Casamance verte et mystérieuse" },
    { id:"ml-bogolan", name:"Bogolan Authentique", country:"Mali", flag:"🇲🇱", region:"Afrique de l'Ouest", family:"Textiles Royaux", colors:["#1C0A00","#8B4513","#D2691E","#F5DEB3","#FAEBD7"], materials:["tissu Bogolan","coton filé main","bois karité","argile Niger","cuir tanné"], patterns:["géométrie Bogolan","carrés imbriqués","losanges","triangles répétitifs"], prompt:"Mali Bogolan mudcloth interior, mud dyed fabric wall art, geometric white patterns on dark brown, clay walls, handwoven cotton, earthy warm tones", description:"Tissu sacré teint à la boue du Niger, géométrie blanche — l'âme profonde du Mali" },
    { id:"ml-dogon", name:"Dogon Falaise", country:"Mali", flag:"🇲🇱", region:"Afrique de l'Ouest", family:"Terres & Banco", colors:["#8B6914","#D2691E","#2C1810","#F4A460","#696969"], materials:["banco","bois de doum","pierre de falaise","échelles sculptées","portes gravées"], patterns:["sculptures de greniers","cosmogonie Dogon","figures Nommo"], prompt:"Dogon cliff interior Mali, sculpted wooden doors mythological motifs, banco clay walls, granary shapes, ancient sacred, dramatic stone earth tones", description:"Greniers sculptés, portes gravées de cosmogonie — l'univers sacré Dogon de Bandiagara" },
    { id:"ml-djenne", name:"Djenné Soudano-Sahélien", country:"Mali", flag:"🇲🇱", region:"Afrique de l'Ouest", family:"Terres & Banco", colors:["#C4A882","#8B6914","#DEB887","#5C4033","#F5F5DC"], materials:["banco","poutres rônier","poteries Djenné","nattes palmier","coton"], patterns:["tours coniques banco","niches décoratives","arcs brisés"], prompt:"Djenne Sudano-Sahelian interior, banco mud architecture, wooden rondavel poles, Malian earthen aesthetic, warm beige brown, handmade pottery", description:"Architecture en banco, poutres de rônier et poteries — la grandeur de Djenné la bâtisseuse" },
    { id:"gh-kente", name:"Kente Royal", country:"Ghana", flag:"🇬🇭", region:"Afrique de l'Ouest", family:"Textiles Royaux", colors:["#FFD700","#228B22","#8B0000","#1A2744","#FF8C00"], materials:["soie Kente","fils d'or","bois wengé","velours","bronze Ashanti"], patterns:["bandes Kente","symboles Adinkra","losanges d'or","chevrons royaux"], prompt:"Kente royal Ghanaian interior, gold green Kente cloth wall installation, Ashanti throne inspired furniture, Adinkra symbols, jewel tones, luxury photography", description:"Soie Kente en bandes dorées, symboles Adinkra et bronze Ashanti — la royauté du Ghana" },
    { id:"gh-ashanti", name:"Ashanti Symbolique", country:"Ghana", flag:"🇬🇭", region:"Afrique de l'Ouest", family:"Textiles Royaux", colors:["#8B6914","#000000","#C8A951","#F5F5DC","#8B0000"], materials:["tabourets bois Ashanti","estampilles Adinkra","poids bronze","tissu Kente","or fondu"], patterns:["Adinkra Gye Nyame","Adinkra Sankofa","spirales","croissants"], prompt:"Ashanti symbolic interior Ghana, Adinkra symbol prints on walls, traditional wooden stool coffee table, Kente textile accents, black gold palette", description:"Tabourets sacrés, symboles Adinkra et poids en bronze — le langage symbolique Ashanti" },
    { id:"ci-wax", name:"Ankara Wax Maximalist", country:"Côte d'Ivoire", flag:"🇨🇮", region:"Afrique de l'Ouest", family:"Textiles Royaux", colors:["#FF4500","#FFD700","#006400","#1E90FF","#FF69B4"], materials:["imprimés Wax","tissu Ankara","velours africain","fil d'or","bois zingana"], patterns:["motifs Wax répétitifs","imprimés floraux géants","géométrie colorée"], prompt:"Ankara wax print maximalist interior, bold colorful African wax fabric on walls and furniture, Abidjan contemporary luxury, vibrant prints, gold accents", description:"Imprimés Wax explosifs en rouge, or et bleu — le maximalisme joyeux d'Abidjan" },
    { id:"ci-baoule", name:"Baoulé Sculpté", country:"Côte d'Ivoire", flag:"🇨🇮", region:"Afrique de l'Ouest", family:"Tropical Équatorial", colors:["#3D1C02","#C4863A","#F5DEB3","#8B4513","#2F4F4F"], materials:["masques Baoulé","sièges sculptés","bronze fondu","bois caïlcédrat","raphia"], patterns:["visages sculptés","motifs scarifications","spirales fertilité"], prompt:"Baule Ivory Coast interior, wooden mask wall display, carved figures, dark polished wood, bronze accents, gallery sacred objects, museum lighting", description:"Masques sculptés encadrés, sièges à caryatide — l'art sacré de la forêt ivoirienne" },
    { id:"ng-yoruba", name:"Yoruba Aso-Oke", country:"Nigeria", flag:"🇳🇬", region:"Afrique de l'Ouest", family:"Textiles Royaux", colors:["#4B0082","#FF8C00","#C0C0C0","#FFD700","#F5F5DC"], materials:["tissu Aso-Oke","velours Yoruba","perles Yoruba","bronzes d'Ife","bois Iroko"], patterns:["bandes Aso-Oke","Alaari","Sanyan naturel","Etu indigo"], prompt:"Yoruba Aso-Oke interior Nigeria, deep indigo handwoven textile, silver thread strips, Ife bronze display, Nigerian royalty, purple gold palette", description:"Tissu Aso-Oke à fils d'argent et bronzes d'Ife — la noblesse Yoruba" },
    { id:"ng-benin", name:"Bénin Bronze", country:"Nigeria", flag:"🇳🇬", region:"Afrique de l'Ouest", family:"Textiles Royaux", colors:["#8B6914","#2C1810","#C4A882","#B87333","#F5DEB3"], materials:["bronzes du Bénin","ivoire sculpté","tissu corail rouge","bois iroko","cuir royal"], patterns:["plaques narratives bronze","têtes royales d'Oba","guerriers sculptés"], prompt:"Benin Kingdom bronze interior Nigeria, royal bronze plaques on walls, Oba court aesthetic, mahogany wood, red coral accents, museum lighting, regal atmosphere", description:"Plaques en bronze narrant la cour royale — la puissance du Royaume du Bénin" },
    { id:"ng-igbo", name:"Igbo Uli", country:"Nigeria", flag:"🇳🇬", region:"Afrique de l'Ouest", family:"Géométrique Peint", colors:["#FFFFFF","#000000","#D2691E","#8B0000","#F5DEB3"], materials:["kaolin blanc","encre noire naturelle","tissu Ukara","bambou","argile"], patterns:["spirales Uli","feuilles stylisées","corps féminins abstraits","lignes ondulées"], prompt:"Igbo Uli body art inspired interior, black curvilinear patterns on white walls, feminine abstract motifs, Ukara cloth display, monochrome with clay accents", description:"Spirales Uli noires sur fond blanc — peintures corporelles Igbo transposées en art mural" },
    { id:"ng-lagos", name:"Lagos Afrobeat", country:"Nigeria", flag:"🇳🇬", region:"Afrique de l'Ouest", family:"Urbain Contemporain", colors:["#FF4500","#006400","#FFFFFF","#000000","#FFD700"], materials:["béton poli","tissu Wax encadré","métal découpé","bois recyclé","néons"], patterns:["street art Lagos","Adire indigo","motifs Okrika","typographie africaine"], prompt:"Lagos Afrobeat contemporary interior, Nigerian urban energy, concrete walls with Ankara textile art, neon accents, industrial African design, studio apartment", description:"Béton poli, Wax encadré et néons — l'énergie créative de Lagos" },
    { id:"cm-bamileke", name:"Bamileke Prestige", country:"Cameroun", flag:"🇨🇲", region:"Afrique Centrale", family:"Textiles Royaux", colors:["#4B0082","#FFD700","#FFFFFF","#000000","#C0392B"], materials:["perles royales Bamileke","trônes sculptés","plumes pangolin","tissu ndop","ébène"], patterns:["araignées symboliques","grenouilles fertilité","double cloche","éléphant royal"], prompt:"Bamileke prestige interior Cameroon, royal beaded throne centerpiece, purple gold ndop textile, ceremonial masks, carved wooden pillars, grasslands luxury", description:"Trônes couverts de perles, Ndop violet — le prestige des chefferies Bamileke" },
    { id:"cd-kuba", name:"Kuba Royaume", country:"RD Congo", flag:"🇨🇩", region:"Afrique Centrale", family:"Textiles Royaux", colors:["#8B4513","#000000","#DEB887","#8B6914","#F5DEB3"], materials:["velours raphia Kuba","tissu coupé ciselé","bois sculpté","cauris","cuivre"], patterns:["entrelacs géométriques Kuba","motifs Mikope","damiers complexes","spirales imbriquées"], prompt:"Kuba Kingdom Congo interior, cut velvet raphia geometric patterns, royal cloth upholstery, carved wooden objects, warm brown black geometric rhythm", description:"Velours de raphia en damiers complexes — le génie textile du Royaume Kuba" },
    { id:"rw-imigongo", name:"Imigongo Géométrique", country:"Rwanda", flag:"🇷🇼", region:"Afrique de l'Est", family:"Géométrique Peint", colors:["#000000","#FFFFFF","#8B4513","#DEB887","#A0522D"], materials:["bouse vache séchée","kaolin blanc","charbon végétal","bois local","argile"], patterns:["spirales concentriques Imigongo","croix symétriques","losanges noirs blancs","chevrons"], prompt:"Rwanda Imigongo geometric art interior, black white cow dung relief wall panels, bold spiral chevron patterns, monochrome graphic African art gallery", description:"Art en bouse de vache, spirales noires et blanches en relief — l'art géométrique unique du Rwanda" },
    { id:"ke-maasai", name:"Maasaï Warrior", country:"Kenya", flag:"🇰🇪", region:"Afrique de l'Est", family:"Sauvage & Nomade", colors:["#CC0000","#1565C0","#F5F5DC","#000000","#FF8C00"], materials:["tissu Shuka carreaux","perles Maasaï","cuir de chèvre","bois acacia","coton rouge"], patterns:["carreaux Shuka rouge bleu","colliers perles répétés","motifs guerriers linéaires"], prompt:"Maasai warrior interior Kenya, red checkered Shuka blankets, colorful beaded jewelry wall art, acacia wood furniture, bold red blue, African plains lodge", description:"Tissu Shuka rouge, colliers de perles et acacia — l'esprit guerrier Maasaï" },
    { id:"ke-lamu", name:"Swahili Lamu", country:"Kenya", flag:"🇰🇪", region:"Afrique de l'Est", family:"Côtier Swahili", colors:["#DEB887","#FFFFFF","#1565C0","#8B4513","#F5DEB3"], materials:["bois mangrove sculpté","nattes palmier","tissu Kanga","corail blanc","laiton"], patterns:["portes Lamu sculptées","treillis géométriques","niches cintrées","banquettes plâtre"], prompt:"Swahili Lamu island interior Kenya, carved mangrove wood doors, white coral walls, Kanga cushions, Indian Ocean influence, brass oil lamps, coastal luxury", description:"Portes en mangrove sculpté, corail blanc et Kanga — le raffinement swahili de Lamu" },
    { id:"tz-zanzibar", name:"Zanzibar Luxe", country:"Tanzanie", flag:"🇹🇿", region:"Afrique de l'Est", family:"Côtier Swahili", colors:["#DEB887","#FFFFFF","#1B4F72","#2E8B57","#C4A35A"], materials:["bois rose sculpté","tissu Kanga","perles Zanzibar","cuivre","dentelle Zanzibari"], patterns:["portes Zanzibari clous laiton","dentelle fenêtres","motifs épices","arabesques"], prompt:"Zanzibar luxury interior, ornate carved wooden bed brass studs, Kanga textile draping, white lime walls, turquoise gold accents, boutique hotel photography", description:"Portes sculptées à clous de laiton, lit en bois de rose — le luxe swahili de l'île aux épices" },
    { id:"tz-tinga", name:"Tinga Tinga Art", country:"Tanzanie", flag:"🇹🇿", region:"Afrique de l'Est", family:"Urbain Contemporain", colors:["#FF4500","#FFD700","#32CD32","#1E90FF","#FF1493"], materials:["peintures Tinga Tinga","tissu batik","bois peint","métal coloré","plastique recyclé"], patterns:["animaux naïfs colorés","poissons géométriques","oiseaux répétitifs","spirales animales"], prompt:"Tinga Tinga painting inspired interior Tanzania, naive colorful animal paintings wall art, electric enamel colors, safari animals, African pop art maximalist", description:"Peintures naïves d'animaux aux couleurs pop — l'art de rue Tinga Tinga de Dar es Salaam" },
    { id:"et-axoum", name:"Axoumite Antique", country:"Éthiopie", flag:"🇪🇹", region:"Afrique de l'Est", family:"Islamique Africain", colors:["#C9A84C","#2C1810","#FFFFFF","#C41E3A","#006400"], materials:["pierre basaltique","lin Habesha","bijoux argent Harari","croix coptes","bois olivier"], patterns:["croix éthiopiennes","arc Axoumite","motifs Lalibela","tissu Tibeb brodé"], prompt:"Ancient Axum Ethiopian interior, basalt stone walls, Coptic cross motifs, white Habesha linen, Lalibela rock church inspiration, candlelit sacred atmosphere", description:"Pierre basaltique, croix coptes et lin Habesha — la grandeur antique du Royaume d'Axoum" },
    { id:"et-harar", name:"Harar Coloré", country:"Éthiopie", flag:"🇪🇹", region:"Afrique de l'Est", family:"Géométrique Peint", colors:["#32CD32","#FFD700","#FF4500","#9400D3","#FFFFFF"], materials:["murs peints vert jaune","paniers Harari","eucalyptus","nattes"], patterns:["paniers Harari à motifs","façades peintes colorées","tressage géométrique"], prompt:"Harar Ethiopia colorful interior, green yellow painted walls, traditional woven baskets wall art, spice market colors, cozy intimate merchant house", description:"Murs peints en vert et jaune vif, paniers Harari en cascade — la cité aux 99 mosquées" },
    { id:"za-ndebele", name:"Ndebele Bold", country:"Afrique du Sud", flag:"🇿🇦", region:"Afrique Australe", family:"Géométrique Peint", colors:["#FFFFFF","#000000","#FF0000","#0000FF","#FFFF00"], materials:["peinture acrylique","perles Ndebele","tissu apron","métal coloré","béton"], patterns:["triangles imbriqués","rectangles concentriques","formes géométriques primaires","contours noirs épais"], prompt:"Ndebele geometric art interior South Africa, bold painted triangles red blue yellow white walls, thick black outlines, Esther Mahlangu inspired wall mural, primary colors", description:"Triangles et rectangles en couleurs primaires — l'art mural Ndebele d'Esther Mahlangu" },
    { id:"za-zulu", name:"Zulu Prestige", country:"Afrique du Sud", flag:"🇿🇦", region:"Afrique Australe", family:"Sauvage & Nomade", colors:["#000000","#FF0000","#FFFFFF","#FFFF00","#228B22"], materials:["boucliers peau de bœuf","perles colorées","corne sculptée","peau léopard","bois acacia"], patterns:["motifs boucliers Zulu","codes couleurs perles","triangles isométriques","zigzags"], prompt:"Zulu prestige interior South Africa, cowhide shield wall display, Zulu beadwork panels, black red palette, leopard textile, warrior ceremonial objects, lodge luxury", description:"Boucliers en peau, perles aux codes symboliques — la puissance cérémonielle Zulu" },
    { id:"za-capemalay", name:"Cape Malay", country:"Afrique du Sud", flag:"🇿🇦", region:"Afrique Australe", family:"Islamique Africain", colors:["#FF69B4","#FFD700","#00CED1","#FF6347","#98FB98"], materials:["façades colorées","carrelage Cape Malay","bois peint","tissu batik malais","aromates"], patterns:["façades pastel colorées","ornements islamiques","motifs batik malais"], prompt:"Cape Malay Bo-Kaap interior South Africa, pastel painted walls pink yellow, Malay-Islamic decorative patterns, spice trade history, colorful Cape Town, bright daylight", description:"Façades en rose, jaune et turquoise, carrelage et épices — l'héritage malais du Cap" },
    { id:"na-himba", name:"Himba Rouge", country:"Namibie", flag:"🇳🇦", region:"Afrique Australe", family:"Sauvage & Nomade", colors:["#8B2500","#D2691E","#000000","#F4A460","#DEB887"], materials:["ocre Otjize","peau de chèvre","bois mopane","ornements métal","corne de bœuf"], patterns:["motifs ocre sur surfaces","silhouettes Himba","cercles concentriques"], prompt:"Himba red ochre interior Namibia, deep red earthy tones Otjize inspired, mopane wood, goat leather, desert minimalism, raw organic materials, dramatic desert light", description:"Ocre rouge Otjize, peau de chèvre et bois de mopane — la beauté primitive Himba" },
    { id:"na-namib", name:"Désert Namib", country:"Namibie", flag:"🇳🇦", region:"Afrique Australe", family:"Sauvage & Nomade", colors:["#E2703A","#2C1810","#F5DEB3","#87CEEB","#696969"], materials:["quartzite","bois pétrifié","sable dune","métal rouillé","verre soufflé"], patterns:["ondes de dunes","craquelures désert","minimalisme extrême","horizons"], prompt:"Namib desert interior, ochre orange sand dune textures, petrified wood, rust sand palette, extreme minimalism, Namibian minerals, desert luxury lodge, golden hour", description:"Orange de dune, bois pétrifié et minimalisme — le désert le plus vieux du monde" },
    { id:"mg-merina", name:"Merina Hauts Plateaux", country:"Madagascar", flag:"🇲🇬", region:"Afrique Australe", family:"Terres & Banco", colors:["#8B0000","#DEB887","#F5F5DC","#228B22","#8B4513"], materials:["brique rouge","bois palissandre","soie Lamba","raphia malgache","poterie Merina"], patterns:["sculptures portes Merina","motifs Lamba tissés","broderies de soie"], prompt:"Merina Madagascar highlands interior, red brick walls, rosewood furniture, Lamba silk textiles, Antananarivo historic house, terracotta elements, cool misty highland", description:"Brique rouge des hauts plateaux, palissandre et soie Lamba — l'élégance royale Merina" },
    { id:"bj-vodoun", name:"Vodoun Sacré", country:"Bénin", flag:"🇧🇯", region:"Afrique de l'Ouest", family:"Tropical Équatorial", colors:["#8B0000","#000000","#FFFFFF","#FF8C00","#4B0082"], materials:["fer forgé d'Ogoun","tissu rouge Vodoun","kaolin","plumes","récipients rituels"], patterns:["vévés Vodoun en fer forgé","motifs serpents Dan","étoiles rituelles"], prompt:"Voodoo sacred interior Benin, Ogun iron sculptures, white kaolin objects, deep red black palette, spiritual atmosphere, forged metal wall art, dark moody photography", description:"Sculptures en fer d'Ogoun, kaolin blanc — l'univers sacré du Vodoun de Ouidah" },
    { id:"bj-fon", name:"Fon Appliqué", country:"Bénin", flag:"🇧🇯", region:"Afrique de l'Ouest", family:"Textiles Royaux", colors:["#FFD700","#8B0000","#006400","#000000","#F5DEB3"], materials:["appliqués textiles Fon","velours découpé","tissu coton","fil d'or","bois iroko"], patterns:["roi d'Abomey appliqué","guerriers cousus","animaux héraldiques","scènes historiques"], prompt:"Fon Kingdom Dahomey applique interior Benin, royal textile wall hangings sewn battle scenes, Abomey palace, gold crimson, tapestry storytelling, African heritage museum", description:"Tapisseries d'appliqués cousus racontant les batailles du Dahomey — l'art royal des Fon" },
    { id:"ne-touareg", name:"Touareg Aïr", country:"Niger", flag:"🇳🇪", region:"Afrique de l'Ouest", family:"Sauvage & Nomade", colors:["#1A237E","#000000","#C9A84C","#F5F5DC","#4A4A4A"], materials:["cuir chameau","argent ciselé","tissu indigo","tente peau","bois ébène"], patterns:["croix d'Agadez argent","motifs de selle","inscriptions Tifinagh","géométrie nomade"], prompt:"Tuareg Air Niger interior, deep indigo leather tent atmosphere, silver Agadez cross jewelry, Saharan nomadic luxury, camel leather poufs, night blue, elegant minimal", description:"Indigo profond, argent ciselé d'Agadez — les Hommes Bleus du Sahara" },
    { id:"bf-kasena", name:"Kasena Mural", country:"Burkina Faso", flag:"🇧🇫", region:"Afrique de l'Ouest", family:"Géométrique Peint", colors:["#000000","#FFFFFF","#D2691E","#8B0000","#F5DEB3"], materials:["enduit de banco","kaolin blanc","charbon végétal","paille tressée","bois néré"], patterns:["motifs géométriques Kasena","réseau triangles","bandes bicolores"], prompt:"Kasena mural art interior Burkina Faso, black white geometric patterns on mud walls, triangular motifs, Tiebele village architecture, Sahel earthy, African geometry", description:"Triangles bicolores peints sur banco — l'art mural féminin Kasena de Tiébélé" },
    { id:"rw-agaseke", name:"Agaseke Tressé", country:"Rwanda", flag:"🇷🇼", region:"Afrique de l'Est", family:"Sauvage & Nomade", colors:["#DEB887","#8B6914","#F5DEB3","#2E8B57","#FAEBD7"], materials:["paniers Agaseke sisal","raphia tressé","bambou Rwanda","lin","bois eucalyptus"], patterns:["spirales de paix","motifs V imbriqués","rayures géométriques tressées"], prompt:"Rwanda Agaseke peace basket interior, coiled sisal baskets wall art, natural woven textures, green hills, neutral warm palette, handcraft artisan, UNESCO heritage", description:"Paniers de paix en sisal, motifs en spirale — patrimoine UNESCO du Rwanda" },
    { id:"ga-fang", name:"Fang Reliquaire", country:"Gabon", flag:"🇬🇦", region:"Afrique Centrale", family:"Tropical Équatorial", colors:["#3D1C02","#C4A35A","#000000","#8B4513","#F5DEB3"], materials:["boîtes reliques Byeri","bronze patiné","fibre végétale","bois padouk","raphia"], patterns:["visages gardiens Fang","formes cubistes","motifs protection","cylindres sacrés"], prompt:"Fang reliquary Gabon interior, Byeri ancestral guardian figures gallery setting, equatorial forest dark wood, bronze patina, African art collector space, museum spotlighting", description:"Boîtes à reliques Byeri, gardiens cubistes — l'art Fang qui inspira Picasso" },
    { id:"ug-buganda", name:"Buganda Barkcloth", country:"Ouganda", flag:"🇺🇬", region:"Afrique de l'Est", family:"Textiles Royaux", colors:["#8B4513","#D2691E","#F5DEB3","#8B6914","#2C1810"], materials:["barkcloth Mutuba","tambours royaux","bois ébène","raphia","tissu écorce battue"], patterns:["texture écorce battue","motifs royaux Buganda","symboles de clan"], prompt:"Buganda Uganda barkcloth interior, Mutuba fig tree bark fabric wall covering, royal drum display, warm earthy brown, UNESCO heritage material, organic texture", description:"Tissu d'écorce de figuier Mutuba, tambours royaux — le patrimoine Buganda" },
    { id:"zw-shona", name:"Shona Sculpture", country:"Zimbabwe", flag:"🇿🇼", region:"Afrique Australe", family:"Tropical Équatorial", colors:["#708090","#2F4F4F","#C4A35A","#F5F5DC","#556B2F"], materials:["sculpture verdite","stéatite verte","pierre serpentine","bois mukwa","métal"], patterns:["formes organiques abstraites","figures humaines stylisées","fusion humain-animal"], prompt:"Shona sculpture Zimbabwe interior, green verdite stone sculptures centerpieces, serpentine abstract figures, polished stone surfaces, gallery lighting, modern African art", description:"Sculptures en verdite verte, formes organiques abstraites — l'école Shona mondialement reconnue" },
    { id:"so-nomade", name:"Nomade Somali", country:"Somalie", flag:"🇸🇴", region:"Afrique de l'Est", family:"Sauvage & Nomade", colors:["#DEB887","#8B4513","#87CEEB","#F5DEB3","#228B22"], materials:["tente Aqal","nattes tressées","tissu Dirac","cuir chameau","bambou"], patterns:["tressage géométrique nattes","motifs Dirac brodé","arabesques somalies"], prompt:"Somali nomadic aqal tent interior, woven grass mat walls, camel leather poufs, colorful Dirac fabric draping, Horn of Africa, portable cozy nomadic aesthetic", description:"Tente Aqal de nattes tressées, Dirac coloré — la vie nomade de la Corne d'Afrique" }
  ]
};

const FAMILY_COLORS = {
  "Terres & Banco": "#8B4513",
  "Textiles Royaux": "#8B6914",
  "Côtier Swahili": "#1B4F72",
  "Géométrique Peint": "#1A237E",
  "Sauvage & Nomade": "#4A235A",
  "Islamique Africain": "#B71C1C",
  "Tropical Équatorial": "#1B5E20",
  "Urbain Contemporain": "#212121"
};

const FAMILY_ICONS = {
  "Terres & Banco": "🏺",
  "Textiles Royaux": "🧵",
  "Côtier Swahili": "⛵",
  "Géométrique Peint": "◈",
  "Sauvage & Nomade": "🌿",
  "Islamique Africain": "☪",
  "Tropical Équatorial": "🌴",
  "Urbain Contemporain": "🏙"
};

export default function StylesDB() {
  const [search, setSearch] = useState("");
  const [activeRegion, setActiveRegion] = useState("Tout");
  const [activeFamily, setActiveFamily] = useState("Tout");
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("grid"); // grid | list
  const [copied, setCopied] = useState(null);

  const filtered = useMemo(() => {
    return DB.styles.filter(s => {
      const matchSearch = !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.country.toLowerCase().includes(search.toLowerCase()) ||
        s.family.toLowerCase().includes(search.toLowerCase());
      const matchRegion = activeRegion === "Tout" || s.region === activeRegion;
      const matchFamily = activeFamily === "Tout" || s.family === activeFamily;
      return matchSearch && matchRegion && matchFamily;
    });
  }, [search, activeRegion, activeFamily]);

  const copyPrompt = (prompt) => {
    navigator.clipboard?.writeText(prompt);
    setCopied(prompt);
    setTimeout(() => setCopied(null), 2000);
  };

  const selectedStyle = selected ? DB.styles.find(s => s.id === selected) : null;

  return (
    <div style={{ fontFamily: "'Georgia', serif", background: "#0C0806", minHeight: "100vh", color: "#F0E6D3" }}>
      {/* Kente header bar */}
      <div style={{ height: "5px", background: "linear-gradient(90deg,#8B0000,#B8860B,#228B22,#1A2744,#B8860B,#C41E3A,#B8860B,#228B22,#8B0000)" }} />

      {/* Header */}
      <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid #1E1208" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "10px", letterSpacing: "0.35em", color: "#B8860B", textTransform: "uppercase", marginBottom: "4px" }}>
              Base de données
            </div>
            <h1 style={{ margin: 0, fontSize: "clamp(20px,3vw,32px)", fontWeight: "normal" }}>
              Styles Africains <span style={{ color: "#B8860B" }}>·</span> <span style={{ color: "#8B7050", fontSize: "0.6em" }}>{filtered.length} / {DB.styles.length}</span>
            </h1>
          </div>
          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un style, pays, famille..."
            style={{
              background: "#160E07", border: "1px solid #2A1A0E", color: "#F0E6D3",
              padding: "10px 16px", borderRadius: "3px", fontSize: "13px",
              width: "280px", fontFamily: "Georgia, serif", outline: "none"
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ marginTop: "20px", display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
          {/* Region filter */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {["Tout", ...DB.regions].map(r => (
              <button key={r} onClick={() => setActiveRegion(r)} style={{
                padding: "5px 12px", border: `1px solid ${activeRegion === r ? "#B8860B" : "#2A1A0E"}`,
                background: activeRegion === r ? "rgba(184,134,11,0.12)" : "transparent",
                color: activeRegion === r ? "#B8860B" : "#6B5030", cursor: "pointer",
                fontSize: "11px", letterSpacing: "0.08em", borderRadius: "2px",
                fontFamily: "Georgia, serif", transition: "all 0.15s"
              }}>{r}</button>
            ))}
          </div>
        </div>

        {/* Family filter */}
        <div style={{ marginTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button onClick={() => setActiveFamily("Tout")} style={{
            padding: "5px 12px", border: `1px solid ${activeFamily === "Tout" ? "#B8860B" : "#2A1A0E"}`,
            background: activeFamily === "Tout" ? "rgba(184,134,11,0.12)" : "transparent",
            color: activeFamily === "Tout" ? "#B8860B" : "#6B5030", cursor: "pointer",
            fontSize: "11px", borderRadius: "2px", fontFamily: "Georgia, serif"
          }}>Toutes</button>
          {DB.families.map(f => (
            <button key={f} onClick={() => setActiveFamily(f)} style={{
              padding: "5px 12px",
              border: `1px solid ${activeFamily === f ? FAMILY_COLORS[f] : "#2A1A0E"}`,
              background: activeFamily === f ? `${FAMILY_COLORS[f]}22` : "transparent",
              color: activeFamily === f ? FAMILY_COLORS[f] : "#6B5030",
              cursor: "pointer", fontSize: "11px", borderRadius: "2px",
              fontFamily: "Georgia, serif", transition: "all 0.15s"
            }}>{FAMILY_ICONS[f]} {f}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 200px)" }}>
        {/* Grid */}
        <div style={{
          flex: 1, padding: "24px 28px",
          display: "grid",
          gridTemplateColumns: selected ? "repeat(auto-fill, minmax(200px, 1fr))" : "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "12px", alignContent: "start"
        }}>
          {filtered.map(style => (
            <div
              key={style.id}
              onClick={() => setSelected(selected === style.id ? null : style.id)}
              style={{
                background: "#120B05",
                border: `1px solid ${selected === style.id ? "#B8860B" : "#1E1208"}`,
                borderRadius: "4px", cursor: "pointer",
                transition: "all 0.2s",
                transform: selected === style.id ? "scale(1.01)" : "scale(1)",
                overflow: "hidden"
              }}
              onMouseEnter={e => { if (selected !== style.id) e.currentTarget.style.borderColor = "#3A2A15"; }}
              onMouseLeave={e => { if (selected !== style.id) e.currentTarget.style.borderColor = "#1E1208"; }}
            >
              {/* Color strip */}
              <div style={{ display: "flex", height: "6px" }}>
                {style.colors.map((c, i) => <div key={i} style={{ flex: 1, background: c }} />)}
              </div>

              <div style={{ padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <span style={{ fontSize: "18px" }}>{style.flag}</span>
                  <span style={{
                    fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase",
                    color: FAMILY_COLORS[style.family] || "#B8860B",
                    padding: "2px 6px", border: `1px solid ${FAMILY_COLORS[style.family]}44`,
                    borderRadius: "2px"
                  }}>{style.family}</span>
                </div>
                <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "2px", color: "#F0E6D3" }}>{style.name}</div>
                <div style={{ fontSize: "11px", color: "#8B7050", marginBottom: "8px" }}>{style.country}</div>
                <p style={{ fontSize: "12px", color: "#7A6040", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
                  {style.description.substring(0, 80)}…
                </p>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 20px", color: "#6B5030", fontStyle: "italic" }}>
              Aucun style trouvé pour cette recherche.
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedStyle && (
          <div style={{
            width: "360px", flexShrink: 0,
            borderLeft: "1px solid #1E1208",
            background: "#0E0905",
            padding: "28px",
            overflowY: "auto",
            maxHeight: "calc(100vh - 200px)",
            position: "sticky", top: 0
          }}>
            {/* Color palette */}
            <div style={{ display: "flex", height: "60px", borderRadius: "3px", overflow: "hidden", marginBottom: "20px" }}>
              {selectedStyle.colors.map((c, i) => (
                <div key={i} title={selectedStyle.colorNames?.[i] || c} style={{ flex: 1, background: c, cursor: "pointer" }} />
              ))}
            </div>

            <div style={{ fontSize: "10px", letterSpacing: "0.25em", color: "#B8860B", textTransform: "uppercase", marginBottom: "6px" }}>
              {selectedStyle.region}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <span style={{ fontSize: "28px" }}>{selectedStyle.flag}</span>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "normal" }}>{selectedStyle.name}</h2>
            </div>
            <div style={{ fontSize: "12px", color: "#8B7050", marginBottom: "12px" }}>
              {selectedStyle.country} · <span style={{ color: FAMILY_COLORS[selectedStyle.family] }}>{selectedStyle.family}</span>
            </div>

            <p style={{ fontSize: "13px", color: "#A08060", lineHeight: 1.7, fontStyle: "italic", marginBottom: "20px" }}>
              {selectedStyle.description}
            </p>

            {/* Colors */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B5030", marginBottom: "8px" }}>Palette</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selectedStyle.colors.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", background: "#160E07", padding: "5px 8px", borderRadius: "2px" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: c, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: "9px", color: "#6B5030" }}>{selectedStyle.colorNames?.[i]}</div>
                      <div style={{ fontSize: "10px", color: "#B8860B", fontFamily: "monospace" }}>{c}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Materials */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B5030", marginBottom: "8px" }}>Matières & Matériaux</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {selectedStyle.materials.map((m, i) => (
                  <span key={i} style={{
                    padding: "3px 8px", background: "#1A1008",
                    border: "1px solid #2A1A0E", borderRadius: "2px",
                    fontSize: "11px", color: "#A08060"
                  }}>{m}</span>
                ))}
              </div>
            </div>

            {/* Patterns */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B5030", marginBottom: "8px" }}>Motifs & Patterns</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {selectedStyle.patterns.map((p, i) => (
                  <span key={i} style={{
                    padding: "3px 8px", background: "#1A1008",
                    border: "1px solid #2A1A0E", borderRadius: "2px",
                    fontSize: "11px", color: "#A08060"
                  }}>{p}</span>
                ))}
              </div>
            </div>

            {/* Prompt */}
            <div>
              <div style={{ fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B5030", marginBottom: "8px" }}>
                Prompt Replicate / FLUX
              </div>
              <div style={{
                background: "#0A0603", border: "1px solid #2A1A0E",
                borderRadius: "3px", padding: "12px",
                fontSize: "11px", color: "#8B7050", lineHeight: 1.6,
                fontFamily: "monospace", marginBottom: "8px"
              }}>
                {selectedStyle.prompt}
              </div>
              <button
                onClick={() => copyPrompt(selectedStyle.prompt)}
                style={{
                  width: "100%", padding: "10px",
                  background: copied === selectedStyle.prompt ? "#228B22" : "transparent",
                  border: `1px solid ${copied === selectedStyle.prompt ? "#228B22" : "#2A1A0E"}`,
                  color: copied === selectedStyle.prompt ? "#FFFFFF" : "#B8860B",
                  cursor: "pointer", fontSize: "11px", letterSpacing: "0.2em",
                  textTransform: "uppercase", borderRadius: "2px",
                  fontFamily: "Georgia, serif", transition: "all 0.2s"
                }}
              >
                {copied === selectedStyle.prompt ? "✓ Copié !" : "⎘ Copier le prompt"}
              </button>
            </div>

            <button
              onClick={() => setSelected(null)}
              style={{
                width: "100%", padding: "8px", marginTop: "12px",
                background: "transparent", border: "1px solid #1E1208",
                color: "#4A3A25", cursor: "pointer", fontSize: "10px",
                letterSpacing: "0.2em", textTransform: "uppercase",
                borderRadius: "2px", fontFamily: "Georgia, serif"
              }}
            >✕ Fermer</button>
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div style={{
        borderTop: "1px solid #1E1208", padding: "16px 32px",
        display: "flex", gap: "24px", flexWrap: "wrap"
      }}>
        {DB.families.map(f => {
          const count = DB.styles.filter(s => s.family === f).length;
          return (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px" }}>{FAMILY_ICONS[f]}</span>
              <span style={{ fontSize: "10px", color: "#4A3A25" }}>{f}</span>
              <span style={{ fontSize: "10px", color: FAMILY_COLORS[f], fontWeight: "bold" }}>{count}</span>
            </div>
          );
        })}
      </div>

      <div style={{ height: "5px", background: "linear-gradient(90deg,#1A2744,#B8860B,#228B22,#8B0000,#B8860B,#1A2744)" }} />
    </div>
  );
}
