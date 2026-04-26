import React, { useEffect, useMemo, useState } from "react";

const IMPORTED_DATA = {"exportedAt": "2026-04-18T11:32:14.903620", "version": "climbcrew-v2-xlsx-transformed", "participants": [{"id": "p1", "nom": "A", "prenom": "Fabien", "passport": "orange", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": true}, {"id": "p2", "nom": "A", "prenom": "Yasmine", "passport": "orange", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p3", "nom": "A", "prenom": "Grégoire", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p4", "nom": "A", "prenom": "Bryan", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p5", "nom": "A", "prenom": "Christophe", "passport": "orange", "cotisation": false, "ffme": true, "canEncadrer": true, "canReferer": false}, {"id": "p6", "nom": "A", "prenom": "Zulfukar", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": true}, {"id": "p7", "nom": "A", "prenom": "Chloé", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p8", "nom": "A", "prenom": "Ludovic", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": true}, {"id": "p9", "nom": "B", "prenom": "Benoît", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": true, "canReferer": false}, {"id": "p10", "nom": "B", "prenom": "Thomas", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": true, "canReferer": false}, {"id": "p11", "nom": "B", "prenom": "Martin", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p12", "nom": "B", "prenom": "Alexandre", "passport": "orange", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p13", "nom": "B", "prenom": "Mehdi", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p14", "nom": "B", "prenom": "Soumaya", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p15", "nom": "B", "prenom": "Sylvie", "passport": "jaune", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": true}, {"id": "p16", "nom": "B", "prenom": "Thomas", "passport": "jaune", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p17", "nom": "B", "prenom": "Grégory", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": true, "canReferer": false}, {"id": "p18", "nom": "B", "prenom": "Agathe", "passport": "jaune", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p19", "nom": "B", "prenom": "Bertrand", "passport": "orange", "cotisation": false, "ffme": true, "canEncadrer": false, "canReferer": true}, {"id": "p20", "nom": "B", "prenom": "Luc", "passport": "orange", "cotisation": false, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p21", "nom": "B", "prenom": "Bastien", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p22", "nom": "B", "prenom": "Dominique", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p23", "nom": "B", "prenom": "Thierry", "passport": "vert", "cotisation": true, "ffme": true, "canEncadrer": true, "canReferer": false}, {"id": "p24", "nom": "B", "prenom": "Damien", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": true}, {"id": "p25", "nom": "B", "prenom": "Colin", "passport": "orange", "cotisation": false, "ffme": true, "canEncadrer": true, "canReferer": false}, {"id": "p26", "nom": "B", "prenom": "Vincent", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": true}, {"id": "p27", "nom": "C", "prenom": "Loic", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p28", "nom": "C", "prenom": "Yann", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p29", "nom": "C", "prenom": "Maxime", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p30", "nom": "C", "prenom": "Louis", "passport": "jaune", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": true}, {"id": "p31", "nom": "C", "prenom": "Alexia", "passport": "orange", "cotisation": false, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p32", "nom": "C", "prenom": "Geoffrey", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p33", "nom": "C", "prenom": "Adrien", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p34", "nom": "C", "prenom": "Constance", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p35", "nom": "C", "prenom": "Axel", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": true}, {"id": "p36", "nom": "C", "prenom": "Erwan", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p37", "nom": "C", "prenom": "Sebastien", "passport": "orange", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": true}, {"id": "p38", "nom": "C", "prenom": "Etienne", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p39", "nom": "D", "prenom": "Ghislain", "passport": "orange", "cotisation": false, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p40", "nom": "D", "prenom": "Quentin", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p41", "nom": "D", "prenom": "Nicolas", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p42", "nom": "D", "prenom": "Martin", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p43", "nom": "D", "prenom": "Cedric", "passport": "jaune", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p44", "nom": "D", "prenom": "Guillaume", "passport": "orange", "cotisation": false, "ffme": true, "canEncadrer": true, "canReferer": false}, {"id": "p45", "nom": "D", "prenom": "Patrice", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p46", "nom": "D", "prenom": "Antoine", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p47", "nom": "D", "prenom": "Sébastien", "passport": "orange", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p48", "nom": "D", "prenom": "Aurélien", "passport": "vert", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": true}, {"id": "p49", "nom": "D", "prenom": "Julie", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p50", "nom": "E", "prenom": "Olivier", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p51", "nom": "E", "prenom": "Salma", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p52", "nom": "E", "prenom": "Ahmed", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p53", "nom": "E", "prenom": "Julie", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p54", "nom": "E", "prenom": "Marvin", "passport": "jaune", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p55", "nom": "F", "prenom": "Dimitri", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p56", "nom": "F", "prenom": "Vivian", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p57", "nom": "F", "prenom": "Laurent", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p58", "nom": "G", "prenom": "Rozenn", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p59", "nom": "G", "prenom": "Lucie", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p60", "nom": "G", "prenom": "Olivier", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p61", "nom": "G", "prenom": "Laurent", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": true, "canReferer": false}, {"id": "p62", "nom": "G", "prenom": "Christian", "passport": "jaune", "cotisation": false, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p63", "nom": "G", "prenom": "Eric", "passport": "orange", "cotisation": false, "ffme": true, "canEncadrer": false, "canReferer": true}, {"id": "p64", "nom": "G", "prenom": "Philippe", "passport": "jaune", "cotisation": false, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p65", "nom": "H", "prenom": "Danivirya", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": true}, {"id": "p66", "nom": "H", "prenom": "Ninon", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p67", "nom": "H", "prenom": "Grégoire", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": true, "canReferer": false}, {"id": "p68", "nom": "H", "prenom": "Rémy", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p69", "nom": "H", "prenom": "Laurie", "passport": "orange", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p70", "nom": "I", "prenom": "Renuga", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p71", "nom": "I", "prenom": "Armand", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p72", "nom": "J", "prenom": "Esteban", "passport": "orange", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": true}, {"id": "p73", "nom": "J", "prenom": "David", "passport": "jaune", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p74", "nom": "J", "prenom": "Vincent", "passport": "jaune", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p75", "nom": "K", "prenom": "Valérie", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p76", "nom": "K", "prenom": "Simon", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p77", "nom": "K", "prenom": "Kevin", "passport": "jaune", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p78", "nom": "K", "prenom": "Jérôme", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p79", "nom": "L", "prenom": "Yoan", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p80", "nom": "L", "prenom": "Michel", "passport": "jaune", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p81", "nom": "L", "prenom": "Xavier", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p82", "nom": "L", "prenom": "Frédéric", "passport": "jaune", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p83", "nom": "L", "prenom": "Christopher", "passport": "vert", "cotisation": true, "ffme": true, "canEncadrer": true, "canReferer": false}, {"id": "p84", "nom": "L", "prenom": "Maxime", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p85", "nom": "L", "prenom": "Guillaume", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": true}, {"id": "p86", "nom": "L", "prenom": "Thaddee", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p87", "nom": "L", "prenom": "Valentin", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p88", "nom": "L", "prenom": "Hugo", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p89", "nom": "L", "prenom": "Emanuël", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p90", "nom": "L", "prenom": "Adrien", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p91", "nom": "L", "prenom": "Marie Laure", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p92", "nom": "L", "prenom": "Alexis", "passport": "orange", "cotisation": false, "ffme": true, "canEncadrer": false, "canReferer": true}, {"id": "p93", "nom": "L", "prenom": "Agnès", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p94", "nom": "L", "prenom": "Vincent", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": true}, {"id": "p95", "nom": "M", "prenom": "Lucas", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": true}, {"id": "p96", "nom": "M", "prenom": "Laure", "passport": "sans", "cotisation": false, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p97", "nom": "M", "prenom": "Renaud", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p98", "nom": "M", "prenom": "Christiane", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": true}, {"id": "p99", "nom": "M", "prenom": "Valentin", "passport": "orange", "cotisation": false, "ffme": true, "canEncadrer": true, "canReferer": false}, {"id": "p100", "nom": "M", "prenom": "Didier", "passport": "orange", "cotisation": false, "ffme": true, "canEncadrer": true, "canReferer": false}, {"id": "p101", "nom": "M", "prenom": "Salomé", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p102", "nom": "M", "prenom": "Brice", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p103", "nom": "M", "prenom": "Jean-Marc", "passport": "jaune", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": true}, {"id": "p104", "nom": "N", "prenom": "Sébastien", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p105", "nom": "M", "prenom": "Florian", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p106", "nom": "N", "prenom": "Maxime", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p107", "nom": "P", "prenom": "Pierre", "passport": "orange", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": true}, {"id": "p108", "nom": "P", "prenom": "Nicolas", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p109", "nom": "P", "prenom": "Vincent", "passport": "jaune", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p110", "nom": "P", "prenom": "Maxime", "passport": "orange", "cotisation": false, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p111", "nom": "P", "prenom": "Kevin K", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p112", "nom": "P", "prenom": "Florence", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": true}, {"id": "p113", "nom": "P", "prenom": "Mathieu", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p114", "nom": "P", "prenom": "Charlène", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": true}, {"id": "p115", "nom": "Q", "prenom": "Alice", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p116", "nom": "Q", "prenom": "Morgan", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p117", "nom": "R", "prenom": "Thomas", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p118", "nom": "R", "prenom": "Sébastien", "passport": "orange", "cotisation": false, "ffme": true, "canEncadrer": true, "canReferer": false}, {"id": "p119", "nom": "R", "prenom": "Jean", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p120", "nom": "R", "prenom": "Charlotte", "passport": "jaune", "cotisation": false, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p121", "nom": "R", "prenom": "Thierry", "passport": "jaune", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p122", "nom": "R", "prenom": "Maxime", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p123", "nom": "R", "prenom": "Pierre-Alexandre", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p124", "nom": "R", "prenom": "Guillaume", "passport": "orange", "cotisation": false, "ffme": true, "canEncadrer": false, "canReferer": true}, {"id": "p125", "nom": "R", "prenom": "Aurélie", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p126", "nom": "S", "prenom": "Clément", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p127", "nom": "S", "prenom": "Bastien", "passport": "orange", "cotisation": false, "ffme": true, "canEncadrer": false, "canReferer": true}, {"id": "p128", "nom": "S", "prenom": "Stéphane", "passport": "jaune", "cotisation": false, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p129", "nom": "S", "prenom": "Jérome", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p130", "nom": "T", "prenom": "Marie", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p131", "nom": "T", "prenom": "Morgane", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p132", "nom": "T", "prenom": "Mathias", "passport": "orange", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p133", "nom": "T", "prenom": "Maurice", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p134", "nom": "T", "prenom": "Jérémy", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p135", "nom": "T", "prenom": "Marc", "passport": "jaune", "cotisation": false, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p136", "nom": "U", "prenom": "Sébastien", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p137", "nom": "V", "prenom": "Kriss Joalan", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p138", "nom": "V", "prenom": "Sacha", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p139", "nom": "V", "prenom": "Mathieu", "passport": "sans", "cotisation": false, "ffme": false, "canEncadrer": false, "canReferer": false}, {"id": "p140", "nom": "V", "prenom": "Bertrand", "passport": "jaune", "cotisation": true, "ffme": true, "canEncadrer": false, "canReferer": false}, {"id": "p141", "nom": "W", "prenom": "Xavier", "passport": "orange", "cotisation": true, "ffme": true, "canEncadrer": true, "canReferer": false}, {"id": "p142", "nom": "X", "prenom": "Tom", "passport": "sans", "cotisation": true, "ffme": false, "canEncadrer": false, "canReferer": false}], "sessions": [{"id": "2025-09-15-midi", "date": "2025-09-15", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": "p15", "participantIds": ["p82", "p60"]}, {"id": "2025-09-15-soir", "date": "2025-09-15", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-09-16-midi", "date": "2025-09-16", "slot": "midi", "status": "encadree", "encadrantId": "p61", "referentId": null, "participantIds": ["p1", "p141", "p131", "p83", "p97", "p51", "p84", "p132", "p4"]}, {"id": "2025-09-16-soir", "date": "2025-09-16", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": "p6", "participantIds": []}, {"id": "2025-09-17-midi", "date": "2025-09-17", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": "p26", "participantIds": []}, {"id": "2025-09-17-soir", "date": "2025-09-17", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": "p141", "participantIds": ["p75", "p60"]}, {"id": "2025-09-18-midi", "date": "2025-09-18", "slot": "midi", "status": "encadree", "encadrantId": "p9", "referentId": null, "participantIds": ["p141", "p82", "p132", "p29", "p15", "p83", "p43", "p105"]}, {"id": "2025-09-18-soir", "date": "2025-09-18", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-09-19-midi", "date": "2025-09-19", "slot": "midi", "status": "encadree", "encadrantId": "p61", "referentId": null, "participantIds": ["p1", "p8", "p30"]}, {"id": "2025-09-19-soir", "date": "2025-09-19", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-09-22-midi", "date": "2025-09-22", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-09-22-soir", "date": "2025-09-22", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-09-23-midi", "date": "2025-09-23", "slot": "midi", "status": "encadree", "encadrantId": "p83", "referentId": null, "participantIds": []}, {"id": "2025-09-23-soir", "date": "2025-09-23", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-09-24-midi", "date": "2025-09-24", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-09-24-soir", "date": "2025-09-24", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-09-25-midi", "date": "2025-09-25", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-09-25-soir", "date": "2025-09-25", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-09-26-midi", "date": "2025-09-26", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-09-26-soir", "date": "2025-09-26", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-09-29-midi", "date": "2025-09-29", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-09-29-soir", "date": "2025-09-29", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-09-30-midi", "date": "2025-09-30", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-09-30-soir", "date": "2025-09-30", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-01-midi", "date": "2025-10-01", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-01-soir", "date": "2025-10-01", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-02-midi", "date": "2025-10-02", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-02-soir", "date": "2025-10-02", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-03-midi", "date": "2025-10-03", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-03-soir", "date": "2025-10-03", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-06-midi", "date": "2025-10-06", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-06-soir", "date": "2025-10-06", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-07-midi", "date": "2025-10-07", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-07-soir", "date": "2025-10-07", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-08-midi", "date": "2025-10-08", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-08-soir", "date": "2025-10-08", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-09-midi", "date": "2025-10-09", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-09-soir", "date": "2025-10-09", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-10-midi", "date": "2025-10-10", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-10-soir", "date": "2025-10-10", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-13-midi", "date": "2025-10-13", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-13-soir", "date": "2025-10-13", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-14-midi", "date": "2025-10-14", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-14-soir", "date": "2025-10-14", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-15-midi", "date": "2025-10-15", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-15-soir", "date": "2025-10-15", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-16-midi", "date": "2025-10-16", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-16-soir", "date": "2025-10-16", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-17-midi", "date": "2025-10-17", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-17-soir", "date": "2025-10-17", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-20-midi", "date": "2025-10-20", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-20-soir", "date": "2025-10-20", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-21-midi", "date": "2025-10-21", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-21-soir", "date": "2025-10-21", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-22-midi", "date": "2025-10-22", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-22-soir", "date": "2025-10-22", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-23-midi", "date": "2025-10-23", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-23-soir", "date": "2025-10-23", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-24-midi", "date": "2025-10-24", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-24-soir", "date": "2025-10-24", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-27-midi", "date": "2025-10-27", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-27-soir", "date": "2025-10-27", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-28-midi", "date": "2025-10-28", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-28-soir", "date": "2025-10-28", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-29-midi", "date": "2025-10-29", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-29-soir", "date": "2025-10-29", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-30-midi", "date": "2025-10-30", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-30-soir", "date": "2025-10-30", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-31-midi", "date": "2025-10-31", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-10-31-soir", "date": "2025-10-31", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-03-midi", "date": "2025-11-03", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-03-soir", "date": "2025-11-03", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-04-midi", "date": "2025-11-04", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-04-soir", "date": "2025-11-04", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-05-midi", "date": "2025-11-05", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-05-soir", "date": "2025-11-05", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-06-midi", "date": "2025-11-06", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-06-soir", "date": "2025-11-06", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-07-midi", "date": "2025-11-07", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-07-soir", "date": "2025-11-07", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-10-midi", "date": "2025-11-10", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-10-soir", "date": "2025-11-10", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-11-midi", "date": "2025-11-11", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-11-soir", "date": "2025-11-11", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-12-midi", "date": "2025-11-12", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-12-soir", "date": "2025-11-12", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-13-midi", "date": "2025-11-13", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-13-soir", "date": "2025-11-13", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-14-midi", "date": "2025-11-14", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-14-soir", "date": "2025-11-14", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-17-midi", "date": "2025-11-17", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-17-soir", "date": "2025-11-17", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-18-midi", "date": "2025-11-18", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-18-soir", "date": "2025-11-18", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-19-midi", "date": "2025-11-19", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-19-soir", "date": "2025-11-19", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-20-midi", "date": "2025-11-20", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-20-soir", "date": "2025-11-20", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-21-midi", "date": "2025-11-21", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-21-soir", "date": "2025-11-21", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-24-midi", "date": "2025-11-24", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-24-soir", "date": "2025-11-24", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-25-midi", "date": "2025-11-25", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-25-soir", "date": "2025-11-25", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-26-midi", "date": "2025-11-26", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-26-soir", "date": "2025-11-26", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-27-midi", "date": "2025-11-27", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-27-soir", "date": "2025-11-27", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-28-midi", "date": "2025-11-28", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-11-28-soir", "date": "2025-11-28", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-01-midi", "date": "2025-12-01", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-01-soir", "date": "2025-12-01", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-02-midi", "date": "2025-12-02", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-02-soir", "date": "2025-12-02", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-03-midi", "date": "2025-12-03", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-03-soir", "date": "2025-12-03", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-04-midi", "date": "2025-12-04", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-04-soir", "date": "2025-12-04", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-05-midi", "date": "2025-12-05", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-05-soir", "date": "2025-12-05", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-08-midi", "date": "2025-12-08", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-08-soir", "date": "2025-12-08", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-09-midi", "date": "2025-12-09", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-09-soir", "date": "2025-12-09", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-10-midi", "date": "2025-12-10", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-10-soir", "date": "2025-12-10", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-11-midi", "date": "2025-12-11", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-11-soir", "date": "2025-12-11", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-12-midi", "date": "2025-12-12", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-12-soir", "date": "2025-12-12", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-15-midi", "date": "2025-12-15", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-15-soir", "date": "2025-12-15", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-16-midi", "date": "2025-12-16", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-16-soir", "date": "2025-12-16", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-17-midi", "date": "2025-12-17", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-17-soir", "date": "2025-12-17", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-18-midi", "date": "2025-12-18", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-18-soir", "date": "2025-12-18", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-19-midi", "date": "2025-12-19", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-19-soir", "date": "2025-12-19", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-22-midi", "date": "2025-12-22", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-22-soir", "date": "2025-12-22", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-23-midi", "date": "2025-12-23", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-23-soir", "date": "2025-12-23", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-24-midi", "date": "2025-12-24", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-24-soir", "date": "2025-12-24", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-25-midi", "date": "2025-12-25", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-25-soir", "date": "2025-12-25", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-26-midi", "date": "2025-12-26", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-26-soir", "date": "2025-12-26", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-29-midi", "date": "2025-12-29", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-29-soir", "date": "2025-12-29", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-30-midi", "date": "2025-12-30", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-30-soir", "date": "2025-12-30", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-31-midi", "date": "2025-12-31", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2025-12-31-soir", "date": "2025-12-31", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-01-midi", "date": "2026-01-01", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-01-soir", "date": "2026-01-01", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-02-midi", "date": "2026-01-02", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-02-soir", "date": "2026-01-02", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-05-midi", "date": "2026-01-05", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-05-soir", "date": "2026-01-05", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-06-midi", "date": "2026-01-06", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-06-soir", "date": "2026-01-06", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-07-midi", "date": "2026-01-07", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-07-soir", "date": "2026-01-07", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-08-midi", "date": "2026-01-08", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-08-soir", "date": "2026-01-08", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-09-midi", "date": "2026-01-09", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-09-soir", "date": "2026-01-09", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-12-midi", "date": "2026-01-12", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-12-soir", "date": "2026-01-12", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-13-midi", "date": "2026-01-13", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-13-soir", "date": "2026-01-13", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-14-midi", "date": "2026-01-14", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-14-soir", "date": "2026-01-14", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-15-midi", "date": "2026-01-15", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-15-soir", "date": "2026-01-15", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-16-midi", "date": "2026-01-16", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-16-soir", "date": "2026-01-16", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-19-midi", "date": "2026-01-19", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-19-soir", "date": "2026-01-19", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-20-midi", "date": "2026-01-20", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-20-soir", "date": "2026-01-20", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-21-midi", "date": "2026-01-21", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-21-soir", "date": "2026-01-21", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-22-midi", "date": "2026-01-22", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-22-soir", "date": "2026-01-22", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-23-midi", "date": "2026-01-23", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-23-soir", "date": "2026-01-23", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-26-midi", "date": "2026-01-26", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-26-soir", "date": "2026-01-26", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-27-midi", "date": "2026-01-27", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-27-soir", "date": "2026-01-27", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-28-midi", "date": "2026-01-28", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-28-soir", "date": "2026-01-28", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-29-midi", "date": "2026-01-29", "slot": "midi", "status": "encadree", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-29-soir", "date": "2026-01-29", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-30-midi", "date": "2026-01-30", "slot": "midi", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}, {"id": "2026-01-30-soir", "date": "2026-01-30", "slot": "soir", "status": "libre", "encadrantId": null, "referentId": null, "participantIds": []}], "ropes": [{"numeroCorde": 1, "actif": true, "couleurCorde": "orange"}, {"numeroCorde": 2, "actif": true, "couleurCorde": "bleue"}, {"numeroCorde": 3, "actif": true, "couleurCorde": "orange"}, {"numeroCorde": 4, "actif": true, "couleurCorde": "bleue"}, {"numeroCorde": 5, "actif": true, "couleurCorde": "orange"}, {"numeroCorde": 6, "actif": true, "couleurCorde": "bleue"}, {"numeroCorde": 7, "actif": true, "couleurCorde": "orange"}, {"numeroCorde": 8, "actif": true, "couleurCorde": "bleue"}, {"numeroCorde": 9, "actif": true, "couleurCorde": "orange"}, {"numeroCorde": 10, "actif": true, "couleurCorde": "bleue"}, {"numeroCorde": 11, "actif": true, "couleurCorde": "orange"}, {"numeroCorde": 12, "actif": true, "couleurCorde": "bleue"}, {"numeroCorde": 13, "actif": true, "couleurCorde": "orange"}, {"numeroCorde": 14, "actif": true, "couleurCorde": "bleue"}, {"numeroCorde": 15, "actif": true, "couleurCorde": "orange"}, {"numeroCorde": 16, "actif": true, "couleurCorde": "bleue"}, {"numeroCorde": 17, "actif": true, "couleurCorde": "orange"}, {"numeroCorde": 18, "actif": true, "couleurCorde": "bleue"}, {"numeroCorde": 19, "actif": true, "couleurCorde": "orange"}, {"numeroCorde": 20, "actif": true, "couleurCorde": "bleue"}, {"numeroCorde": 21, "actif": true, "couleurCorde": "orange"}, {"numeroCorde": 22, "actif": true, "couleurCorde": "bleue"}, {"numeroCorde": 23, "actif": true, "couleurCorde": "orange"}, {"numeroCorde": 24, "actif": true, "couleurCorde": "bleue"}, {"numeroCorde": 25, "actif": true, "couleurCorde": "orange"}], "routes": [{"id": "r1", "numeroVoieUnique": "1001", "numeroCorde": 1, "couleurPrises": "blanc", "cotationReference": "5b", "cotationAjustee": "5b", "nomVoie": "Bicéphale", "nomOuvreur": "Romy/Tom", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r2", "numeroVoieUnique": "1002", "numeroCorde": 2, "couleurPrises": "vert", "cotationReference": "4c", "cotationAjustee": "4c", "nomVoie": "", "nomOuvreur": "pro: Valentin", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r3", "numeroVoieUnique": "1003", "numeroCorde": 2, "couleurPrises": "noire", "cotationReference": "5b", "cotationAjustee": "5b", "nomVoie": "Noir c'est noir", "nomOuvreur": "Thierry", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r4", "numeroVoieUnique": "1004", "numeroCorde": 3, "couleurPrises": "rose", "cotationReference": "7a", "cotationAjustee": "7a", "nomVoie": "", "nomOuvreur": "pro: Valentin", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r5", "numeroVoieUnique": "1005", "numeroCorde": 3, "couleurPrises": "orange", "cotationReference": "5c", "cotationAjustee": "5c", "nomVoie": "Orange mécanique", "nomOuvreur": "Fabien", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r6", "numeroVoieUnique": "1006", "numeroCorde": 3, "couleurPrises": "bleu", "cotationReference": "6a+", "cotationAjustee": "6a+", "nomVoie": "Le grand bleu", "nomOuvreur": "Maxime", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r7", "numeroVoieUnique": "1007", "numeroCorde": 4, "couleurPrises": "noire", "cotationReference": "5a", "cotationAjustee": "5a", "nomVoie": "", "nomOuvreur": "pro: Alexis", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r8", "numeroVoieUnique": "1008", "numeroCorde": 4, "couleurPrises": "vert", "cotationReference": "6a", "cotationAjustee": "6a", "nomVoie": "", "nomOuvreur": "pro: Valentin", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r9", "numeroVoieUnique": "1009", "numeroCorde": 4, "couleurPrises": "blanc", "cotationReference": "6c", "cotationAjustee": "6c", "nomVoie": "", "nomOuvreur": "Martin", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r10", "numeroVoieUnique": "1010", "numeroCorde": 5, "couleurPrises": "rose", "cotationReference": "6a", "cotationAjustee": "6a", "nomVoie": "", "nomOuvreur": "pro: Valentin", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r11", "numeroVoieUnique": "1011", "numeroCorde": 5, "couleurPrises": "bleu", "cotationReference": "6c", "cotationAjustee": "6c", "nomVoie": "", "nomOuvreur": "pro: Sylvain", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r12", "numeroVoieUnique": "1012", "numeroCorde": 5, "couleurPrises": "jaune", "cotationReference": "5c", "cotationAjustee": "5c", "nomVoie": "Re pas simle", "nomOuvreur": "Jean-Marc", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r13", "numeroVoieUnique": "1013", "numeroCorde": 5, "couleurPrises": "orange", "cotationReference": "5b", "cotationAjustee": "5b", "nomVoie": "Le royaume de Salma", "nomOuvreur": "Mathias", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r14", "numeroVoieUnique": "1014", "numeroCorde": 6, "couleurPrises": "violet", "cotationReference": "7b", "cotationAjustee": "7b", "nomVoie": "", "nomOuvreur": "pro: Sylvain", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r15", "numeroVoieUnique": "1015", "numeroCorde": 6, "couleurPrises": "vert", "cotationReference": "6b+", "cotationAjustee": "6b+", "nomVoie": "", "nomOuvreur": "pro: Sylvain", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r16", "numeroVoieUnique": "1016", "numeroCorde": 7, "couleurPrises": "bleu", "cotationReference": "5b", "cotationAjustee": "5b", "nomVoie": "", "nomOuvreur": "pro: Sylvain", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r17", "numeroVoieUnique": "1017", "numeroCorde": 7, "couleurPrises": "orange", "cotationReference": "6a", "cotationAjustee": "6a", "nomVoie": "", "nomOuvreur": "pro: Sylvain", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r18", "numeroVoieUnique": "1018", "numeroCorde": 7, "couleurPrises": "vert", "cotationReference": "5c", "cotationAjustee": "5c", "nomVoie": "", "nomOuvreur": "pro: Alexis", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r19", "numeroVoieUnique": "1019", "numeroCorde": 7, "couleurPrises": "blanc", "cotationReference": "5c", "cotationAjustee": "5c", "nomVoie": "La fin justifie les moyens", "nomOuvreur": "David", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r20", "numeroVoieUnique": "1020", "numeroCorde": 7, "couleurPrises": "rouge", "cotationReference": "6a+", "cotationAjustee": "6a+", "nomVoie": "L'ange Rouge", "nomOuvreur": "Laurent/M. Ange", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r21", "numeroVoieUnique": "1021", "numeroCorde": 8, "couleurPrises": "jaune", "cotationReference": "6b", "cotationAjustee": "6b", "nomVoie": "", "nomOuvreur": "pro: Sylvain", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r22", "numeroVoieUnique": "1022", "numeroCorde": 8, "couleurPrises": "rose", "cotationReference": "5b", "cotationAjustee": "5b", "nomVoie": "", "nomOuvreur": "", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r23", "numeroVoieUnique": "1023", "numeroCorde": 8, "couleurPrises": "vert", "cotationReference": "6b+", "cotationAjustee": "6b+", "nomVoie": "BRU Aware (sans fenetre)", "nomOuvreur": "Thomas", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r24", "numeroVoieUnique": "1024", "numeroCorde": 8, "couleurPrises": "violet", "cotationReference": "6b", "cotationAjustee": "6b", "nomVoie": "Gym Tonic", "nomOuvreur": "", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r25", "numeroVoieUnique": "1025", "numeroCorde": 9, "couleurPrises": "orange", "cotationReference": "7a", "cotationAjustee": "7a", "nomVoie": "", "nomOuvreur": "pro: Alexis", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r26", "numeroVoieUnique": "1026", "numeroCorde": 9, "couleurPrises": "noire", "cotationReference": "6b", "cotationAjustee": "6b", "nomVoie": "Couscous", "nomOuvreur": "Maxime", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r27", "numeroVoieUnique": "1027", "numeroCorde": 9, "couleurPrises": "bleu", "cotationReference": "6a", "cotationAjustee": "6a", "nomVoie": "Pas une de plus", "nomOuvreur": "", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r28", "numeroVoieUnique": "1028", "numeroCorde": 10, "couleurPrises": "rose", "cotationReference": "5b", "cotationAjustee": "5b", "nomVoie": "", "nomOuvreur": "pro: Sylvain", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r29", "numeroVoieUnique": "1029", "numeroCorde": 10, "couleurPrises": "blanche", "cotationReference": "5c", "cotationAjustee": "5c", "nomVoie": "", "nomOuvreur": "pro: Sylvain", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r30", "numeroVoieUnique": "1030", "numeroCorde": 10, "couleurPrises": "vert", "cotationReference": "6c", "cotationAjustee": "6c", "nomVoie": "", "nomOuvreur": "pro: Alexis", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r31", "numeroVoieUnique": "1031", "numeroCorde": 11, "couleurPrises": "bleu", "cotationReference": "6c", "cotationAjustee": "6c", "nomVoie": "", "nomOuvreur": "pro: Sylvain", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r32", "numeroVoieUnique": "1032", "numeroCorde": 11, "couleurPrises": "jaune", "cotationReference": "7a+", "cotationAjustee": "7a+", "nomVoie": "", "nomOuvreur": "pro: Sylvain", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r33", "numeroVoieUnique": "1033", "numeroCorde": 11, "couleurPrises": "noire", "cotationReference": "6a", "cotationAjustee": "6a", "nomVoie": "", "nomOuvreur": "pro: Sylvain", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r34", "numeroVoieUnique": "1034", "numeroCorde": 11, "couleurPrises": "violet", "cotationReference": "6c", "cotationAjustee": "6c", "nomVoie": "", "nomOuvreur": "Valentin", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r35", "numeroVoieUnique": "1035", "numeroCorde": 11, "couleurPrises": "ocre", "cotationReference": "5c", "cotationAjustee": "5c", "nomVoie": "", "nomOuvreur": "Mathias", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r36", "numeroVoieUnique": "1036", "numeroCorde": 12, "couleurPrises": "orange", "cotationReference": "6a+", "cotationAjustee": "6a+", "nomVoie": "", "nomOuvreur": "pro: Valentin", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r37", "numeroVoieUnique": "1037", "numeroCorde": 12, "couleurPrises": "blanc", "cotationReference": "6b", "cotationAjustee": "6b", "nomVoie": "", "nomOuvreur": "pro: Sylvain", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r38", "numeroVoieUnique": "1038", "numeroCorde": 12, "couleurPrises": "vert", "cotationReference": "5a", "cotationAjustee": "5a", "nomVoie": "Avec le dièdre", "nomOuvreur": "Xavier", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r39", "numeroVoieUnique": "1039", "numeroCorde": 12, "couleurPrises": "vert", "cotationReference": "5b", "cotationAjustee": "5b", "nomVoie": "Sans le dièdre", "nomOuvreur": "Xavier", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r40", "numeroVoieUnique": "1040", "numeroCorde": 12, "couleurPrises": "rouge", "cotationReference": "5b", "cotationAjustee": "5b", "nomVoie": "", "nomOuvreur": "Thierry", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r41", "numeroVoieUnique": "1041", "numeroCorde": 13, "couleurPrises": "bleu", "cotationReference": "6b+", "cotationAjustee": "6b+", "nomVoie": "", "nomOuvreur": "pro: Sylvain", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r42", "numeroVoieUnique": "1042", "numeroCorde": 13, "couleurPrises": "rose", "cotationReference": "5a", "cotationAjustee": "5a", "nomVoie": "", "nomOuvreur": "pro: Sylvain", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r43", "numeroVoieUnique": "1043", "numeroCorde": 13, "couleurPrises": "jaune", "cotationReference": "5c", "cotationAjustee": "5c", "nomVoie": "", "nomOuvreur": "Thomas", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r44", "numeroVoieUnique": "1044", "numeroCorde": 14, "couleurPrises": "vert", "cotationReference": "5c", "cotationAjustee": "5c", "nomVoie": "", "nomOuvreur": "pro: Valentin", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r45", "numeroVoieUnique": "1045", "numeroCorde": 14, "couleurPrises": "blanche", "cotationReference": "5b", "cotationAjustee": "5b", "nomVoie": "", "nomOuvreur": "Lucie", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r46", "numeroVoieUnique": "1046", "numeroCorde": 15, "couleurPrises": "noire", "cotationReference": "6a+", "cotationAjustee": "6a+", "nomVoie": "", "nomOuvreur": "pro: Alexis", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r47", "numeroVoieUnique": "1047", "numeroCorde": 15, "couleurPrises": "orange", "cotationReference": "5b", "cotationAjustee": "5b", "nomVoie": "", "nomOuvreur": "pro: Sylain", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r48", "numeroVoieUnique": "1048", "numeroCorde": 15, "couleurPrises": "rose", "cotationReference": "6b+", "cotationAjustee": "6b+", "nomVoie": "Rose et bien frais", "nomOuvreur": "Christopher", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r49", "numeroVoieUnique": "1049", "numeroCorde": 15, "couleurPrises": "bleu", "cotationReference": "5c", "cotationAjustee": "5c", "nomVoie": "Sacrebleu", "nomOuvreur": "Christopher", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r50", "numeroVoieUnique": "1050", "numeroCorde": 15, "couleurPrises": "rouge", "cotationReference": "6a", "cotationAjustee": "6a", "nomVoie": "", "nomOuvreur": "Martin", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r51", "numeroVoieUnique": "1051", "numeroCorde": 16, "couleurPrises": "violet", "cotationReference": "5c", "cotationAjustee": "5c", "nomVoie": "", "nomOuvreur": "pro: Alexis", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r52", "numeroVoieUnique": "1052", "numeroCorde": 16, "couleurPrises": "jaune", "cotationReference": "5c", "cotationAjustee": "5c", "nomVoie": "Pas un zeste", "nomOuvreur": "Fabien", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r53", "numeroVoieUnique": "1053", "numeroCorde": 16, "couleurPrises": "ocre", "cotationReference": "6a", "cotationAjustee": "6a", "nomVoie": "Duo Dingo", "nomOuvreur": "Salma/Fabien", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r54", "numeroVoieUnique": "1054", "numeroCorde": 17, "couleurPrises": "bleu", "cotationReference": "5c", "cotationAjustee": "5c", "nomVoie": "", "nomOuvreur": "pro: Alexis", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r55", "numeroVoieUnique": "1055", "numeroCorde": 17, "couleurPrises": "vert", "cotationReference": "5b", "cotationAjustee": "5b", "nomVoie": "La vie en vert", "nomOuvreur": "Louis", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r56", "numeroVoieUnique": "1056", "numeroCorde": 18, "couleurPrises": "orange", "cotationReference": "5c", "cotationAjustee": "5c", "nomVoie": "", "nomOuvreur": "pro: Alexis", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r57", "numeroVoieUnique": "1057", "numeroCorde": 18, "couleurPrises": "blanche", "cotationReference": "5c", "cotationAjustee": "5c", "nomVoie": "", "nomOuvreur": "Benoit", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r58", "numeroVoieUnique": "1058", "numeroCorde": 19, "couleurPrises": "vert", "cotationReference": "5c", "cotationAjustee": "5c", "nomVoie": "", "nomOuvreur": "pro: Sylvain", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r59", "numeroVoieUnique": "1059", "numeroCorde": 19, "couleurPrises": "rose", "cotationReference": "6a+", "cotationAjustee": "6a+", "nomVoie": "Pétales", "nomOuvreur": "Laurent G", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r60", "numeroVoieUnique": "1060", "numeroCorde": 20, "couleurPrises": "jaune", "cotationReference": "5a", "cotationAjustee": "5a", "nomVoie": "", "nomOuvreur": "pro: Valentin", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r61", "numeroVoieUnique": "1061", "numeroCorde": 20, "couleurPrises": "violet", "cotationReference": "5b", "cotationAjustee": "5b", "nomVoie": "Petite fleur", "nomOuvreur": "Louis", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r62", "numeroVoieUnique": "1062", "numeroCorde": 20, "couleurPrises": "noire", "cotationReference": "5c", "cotationAjustee": "5c", "nomVoie": "Avec le dièdre", "nomOuvreur": "Xavier", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r63", "numeroVoieUnique": "1063", "numeroCorde": 20, "couleurPrises": "noire", "cotationReference": "6a+", "cotationAjustee": "6a+", "nomVoie": "Sans le dièdre", "nomOuvreur": "Xavier", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r64", "numeroVoieUnique": "1064", "numeroCorde": 21, "couleurPrises": "rouge", "cotationReference": "7a", "cotationAjustee": "7a", "nomVoie": "", "nomOuvreur": "pro: Valentin", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r65", "numeroVoieUnique": "1065", "numeroCorde": 21, "couleurPrises": "bleu", "cotationReference": "5b", "cotationAjustee": "5b", "nomVoie": "", "nomOuvreur": "", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r66", "numeroVoieUnique": "1066", "numeroCorde": 21, "couleurPrises": "rose", "cotationReference": "5c", "cotationAjustee": "5c", "nomVoie": "Beubeu", "nomOuvreur": "Benoit", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}, {"id": "r67", "numeroVoieUnique": "1067", "numeroCorde": 22, "couleurPrises": "jaune", "cotationReference": "5c", "cotationAjustee": "5c", "nomVoie": "", "nomOuvreur": "pro: Valentin", "moulinetteOnly": false, "active": true, "dateCreation": "2025-09-15"}], "realisations": [], "selectedDate": "2025-09-15", "selectedParticipantProgress": "p1"};
const STORAGE_KEY = "climbcrew_local_data_v2";
const ADMIN_CODE = "12345678";
const MAX_PARTICIPANTS = 18;
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const USE_API = Boolean(API_BASE);

const GRADES = ["4a","4b","4c","5a","5b","5c","6a","6a+","6b","6b+","6c","6c+","7a","7a+","7b"];
const STYLE_LABELS = {
  a_vue: "À vue",
  flash: "Flash",
  en_tete: "En tête",
  moulinette: "En moulinette",
  avec_repos: "Avec repos",
  travaillee: "Travaillée",
  projet: "Projet",
  non_enchainee: "Non enchaînée",
  test: "Essai / test",
};
const STYLE_WEIGHTS = {
  a_vue: 1.25,
  flash: 1.2,
  en_tete: 1,
  moulinette: 0.85,
  avec_repos: 0.6,
  travaillee: 0.75,
  projet: 0.3,
  non_enchainee: 0.2,
  test: 0.1,
};

function fullName(p) {
  return p ? `${p.nom} ${p.prenom}`.trim() : "";
}
function gradeToIndex(grade) {
  return GRADES.indexOf(grade);
}
function indexToGrade(index) {
  const i = Math.max(0, Math.min(GRADES.length - 1, index));
  return GRADES[i];
}
function getRouteBackgroundColor(color) {
  const normalized = String(color || "").trim().toLowerCase();
  const map = {
    bleu: "#dbeafe", blue: "#dbeafe", rouge: "#fee2e2", red: "#fee2e2",
    vert: "#dcfce7", green: "#dcfce7", jaune: "#fef9c3", yellow: "#fef9c3",
    orange: "#ffedd5", violet: "#ede9fe", purple: "#ede9fe", rose: "#fce7f3",
    pink: "#fce7f3", noir: "#e5e7eb", black: "#e5e7eb", blanc: "#f8fafc",
    white: "#f8fafc", gris: "#f1f5f9", gray: "#f1f5f9", grey: "#f1f5f9",
  };
  return map[normalized] || "#f8fafc";
}
function formatDateFr(dateStr) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
  });
}
function isWeekend(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  const day = d.getDay();
  return day === 0 || day === 6;
}
function nextBusinessDay(dateStr, delta) {
  const d = new Date(`${dateStr}T12:00:00`);
  do { d.setDate(d.getDate() + delta); } while (d.getDay() === 0 || d.getDay() === 6);
  return d.toISOString().slice(0, 10);
}
function calculateSimpleCpr(realisations, routesById) {
  const timeline = realisations
    .map((r) => {
      const route = routesById[r.voieId];
      if (!route) return null;
      return {
        date: r.dateRealisation,
        grade: route.cotationAjustee,
        weightedIndex: gradeToIndex(route.cotationAjustee) * (STYLE_WEIGHTS[r.styleRealisation] || 1),
      };
    })
    .filter(Boolean);
  if (!timeline.length) return { currentGrade: null, averageIndex: null, timeline: [] };
  const recent = [...timeline].sort((a, b) => a.date.localeCompare(b.date)).slice(-10);
  const averageIndex = recent.reduce((sum, item) => sum + item.weightedIndex, 0) / recent.length;
  return { currentGrade: indexToGrade(Math.round(averageIndex)), averageIndex, timeline: recent };
}
function weightedMedian(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => gradeToIndex(a.grade) - gradeToIndex(b.grade));
  const total = sorted.reduce((sum, item) => sum + item.weight, 0);
  let cumulative = 0;
  for (const item of sorted) {
    cumulative += item.weight;
    if (cumulative >= total / 2) return item.grade;
  }
  return sorted[sorted.length - 1].grade;
}
function downloadFile(filename, content, type = "application/json;charset=utf-8;") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Erreur API ${response.status}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

function App() {
  const [tab, setTab] = useState("inscriptions");
  const [viewMode, setViewMode] = useState("jour");
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : IMPORTED_DATA;
    } catch {
      return IMPORTED_DATA;
    }
  });
  const [adminInput, setAdminInput] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [routeError, setRouteError] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [syncMessage, setSyncMessage] = useState(USE_API ? "API activée" : "Mode local");
  const [isSyncing, setIsSyncing] = useState(false);

  const [newParticipant, setNewParticipant] = useState({
    nom: "",
    prenom: "",
    passport: "sans",
    cotisation: false,
    ffme: false,
    canEncadrer: false,
    canReferer: false,
  });
  const [newRoute, setNewRoute] = useState({
    numeroVoieUnique: "",
    numeroCorde: "1",
    couleurPrises: "",
    cotationReference: "5c",
    nomVoie: "",
    nomOuvreur: "",
    moulinetteOnly: false,
  });
  const [newRealisation, setNewRealisation] = useState({
    participantId: IMPORTED_DATA.participants?.[0]?.id || "",
    sessionId: IMPORTED_DATA.sessions?.[0]?.id || "",
    voieId: IMPORTED_DATA.routes?.[0]?.id || "",
    styleRealisation: "a_vue",
    commentaire: "",
    cotationProposee: "",
    nbEssais: "",
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!USE_API) return;
    let isMounted = true;
    (async () => {
      try {
        setIsSyncing(true);
        const [participants, sessions] = await Promise.all([
          apiFetch("/participants"),
          apiFetch("/sessions"),
        ]);
        if (!isMounted) return;
        setState((prev) => ({
          ...prev,
          participants,
          // Si la base ne contient pas encore de séances, on conserve le planning local existant.
          sessions: sessions.length ? sessions : prev.sessions,
        }));
        setSyncMessage(`API connectée · ${participants.length} participants · ${sessions.length} séances`);
      } catch (e) {
        if (!isMounted) return;
        setSyncMessage(`API indisponible · fallback local`);
        console.error(e);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const participantsById = useMemo(
    () => Object.fromEntries(state.participants.map((p) => [p.id, p])),
    [state.participants]
  );
  const routesById = useMemo(
    () => Object.fromEntries(state.routes.map((r) => [r.id, r])),
    [state.routes]
  );
  const sessionsById = useMemo(
    () => Object.fromEntries(state.sessions.map((s) => [s.id, s])),
    [state.sessions]
  );

  const selectedDate = state.selectedDate || IMPORTED_DATA.selectedDate || new Date().toISOString().slice(0, 10);

  const daySessions = useMemo(() => {
    return ["midi", "soir"].map((slot) => {
      const found = state.sessions.find((s) => s.date === selectedDate && s.slot === slot);
      return found || {
        id: `${selectedDate}-${slot}`,
        date: selectedDate,
        slot,
        status: "fermee",
        encadrantId: null,
        referentId: null,
        participantIds: [],
      };
    });
  }, [selectedDate, state.sessions]);

  const weekDates = useMemo(() => {
    const current = new Date(`${selectedDate}T12:00:00`);
    const day = current.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(current);
    monday.setDate(current.getDate() + diff);
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, [selectedDate]);

  const weekSessions = useMemo(() => {
    return weekDates.map((date) => ({
      date,
      sessions: ["midi", "soir"].map((slot) => {
        const found = state.sessions.find((s) => s.date === date && s.slot === slot);
        return found || {
          id: `${date}-${slot}`,
          date,
          slot,
          status: "fermee",
          encadrantId: null,
          referentId: null,
          participantIds: [],
        };
      }),
    }));
  }, [weekDates, state.sessions]);

  const selectedParticipantRealisations = useMemo(() => {
    return state.realisations
      .filter((r) => r.participantId === state.selectedParticipantProgress)
      .sort((a, b) => a.dateRealisation.localeCompare(b.dateRealisation));
  }, [state.realisations, state.selectedParticipantProgress]);

  const participantProgressStats = useMemo(() => {
    const cleanStyles = ["a_vue", "flash", "en_tete"];
    const gradesAll = selectedParticipantRealisations.map((r) => routesById[r.voieId]?.cotationAjustee).filter(Boolean);
    const gradesClean = selectedParticipantRealisations
      .filter((r) => cleanStyles.includes(r.styleRealisation))
      .map((r) => routesById[r.voieId]?.cotationAjustee)
      .filter(Boolean);

    const bestAll = gradesAll.length
      ? gradesAll.reduce((best, current) => (gradeToIndex(current) > gradeToIndex(best) ? current : best))
      : null;

    const bestClean = gradesClean.length
      ? gradesClean.reduce((best, current) => (gradeToIndex(current) > gradeToIndex(best) ? current : best))
      : null;

    return {
      count: selectedParticipantRealisations.length,
      bestAll,
      bestClean,
      cpr: calculateSimpleCpr(selectedParticipantRealisations, routesById),
    };
  }, [selectedParticipantRealisations, routesById]);

  const sessionStats = useMemo(() => {
    const unique = new Set(state.sessions.flatMap((s) => s.participantIds));
    const participationCount = {};
    state.sessions.forEach((session) => {
      session.participantIds.forEach((id) => {
        participationCount[id] = (participationCount[id] || 0) + 1;
      });
    });
    return {
      nombreInscrits: unique.size,
      nombreCotisations: state.participants.filter((p) => p.cotisation).length,
      nombreFFME: state.participants.filter((p) => p.ffme).length,
      nombreRealisations: state.realisations.length,
      nombreVoiesActives: state.routes.filter((r) => r.active).length,
      participationCount,
      sortedParticipants: [...state.participants].sort((a, b) => fullName(a).localeCompare(fullName(b), "fr")),
    };
  }, [state]);

  const routeAggregatesById = useMemo(() => {
    return Object.fromEntries(
      state.routes.map((route) => {
        const proposals = state.realisations
          .filter((r) => r.voieId === route.id && r.cotationProposee)
          .map((r) => ({ grade: r.cotationProposee, style: r.styleRealisation }));

        const weightedProposals = proposals.map((p) => ({ grade: p.grade, weight: STYLE_WEIGHTS[p.style] || 1 }));

        const distribution = GRADES.filter((g) => proposals.some((p) => p.grade === g)).map((g) => ({
          grade: g,
          count: proposals.filter((p) => p.grade === g).length,
        }));

        const averageIndex = proposals.length
          ? proposals.reduce((sum, p) => sum + gradeToIndex(p.grade), 0) / proposals.length
          : null;

        const medianGrade = proposals.length
          ? indexToGrade([...proposals].map((p) => gradeToIndex(p.grade)).sort((a, b) => a - b)[Math.floor((proposals.length - 1) / 2)])
          : null;

        return [route.id, {
          count: proposals.length,
          averageGrade: averageIndex === null ? null : indexToGrade(Math.round(averageIndex)),
          medianGrade,
          weightedMedianGrade: proposals.length >= 5 ? weightedMedian(weightedProposals) : null,
          distribution,
        }];
      })
    );
  }, [state.routes, state.realisations]);

  function setSelectedDate(date) {
    setState((prev) => ({ ...prev, selectedDate: date }));
  }

  function buildDefaultSession(sessionId, patch = {}) {
    const slot = sessionId.endsWith("-soir") ? "soir" : "midi";
    const date = sessionId.slice(0, 10);
    return {
      id: sessionId,
      date,
      slot,
      status: "fermee",
      encadrantId: null,
      referentId: null,
      participantIds: [],
      ...patch,
    };
  }

  async function syncSessionToApi(session) {
    if (!USE_API || !session) return;
    try {
      await apiFetch(`/sessions/${encodeURIComponent(session.id)}`, {
        method: "PUT",
        body: JSON.stringify(session),
      });
      setSyncMessage("Séance synchronisée via l’API");
    } catch (e) {
      setSyncMessage("Erreur synchronisation séance");
      console.error(e);
    }
  }

  function ensureSessionsForDate(date) {
    const createdSessions = [];

    setState((prev) => {
      const sessions = [...prev.sessions];

      ["midi", "soir"].forEach((slot) => {
        if (!sessions.some((s) => s.date === date && s.slot === slot)) {
          const session = {
            id: `${date}-${slot}`,
            date,
            slot,
            status: "fermee",
            encadrantId: null,
            referentId: null,
            participantIds: [],
          };
          sessions.push(session);
          createdSessions.push(session);
        }
      });

      return { ...prev, sessions };
    });

    if (USE_API) {
      createdSessions.forEach((session) => syncSessionToApi(session));
    }
  }

  function updateSession(sessionId, patch) {
    const currentSession =
      state.sessions.find((s) => s.id === sessionId) ||
      buildDefaultSession(sessionId);

    const updatedSession = { ...currentSession, ...patch };

    setState((prev) => {
      const exists = prev.sessions.some((s) => s.id === sessionId);
      return {
        ...prev,
        sessions: exists
          ? prev.sessions.map((s) => (s.id === sessionId ? updatedSession : s))
          : [...prev.sessions, updatedSession],
      };
    });

    syncSessionToApi(updatedSession);
  }

  function addParticipantToSession(sessionId, participantId) {
    if (!participantId) return;

    const currentSession =
      state.sessions.find((s) => s.id === sessionId) ||
      buildDefaultSession(sessionId);

    if (currentSession.participantIds.includes(participantId)) return;

    const occupied =
      currentSession.participantIds.length +
      (currentSession.encadrantId ? 1 : 0) +
      (currentSession.referentId ? 1 : 0);

    if (occupied >= MAX_PARTICIPANTS) return;

    const updatedSession = {
      ...currentSession,
      participantIds: [...currentSession.participantIds, participantId],
    };

    setState((prev) => {
      const exists = prev.sessions.some((s) => s.id === sessionId);
      return {
        ...prev,
        sessions: exists
          ? prev.sessions.map((s) => (s.id === sessionId ? updatedSession : s))
          : [...prev.sessions, updatedSession],
      };
    });

    syncSessionToApi(updatedSession);
  }

  function removeParticipantFromSession(sessionId, participantId) {
    const currentSession =
      state.sessions.find((s) => s.id === sessionId) ||
      buildDefaultSession(sessionId);

    const updatedSession = {
      ...currentSession,
      participantIds: currentSession.participantIds.filter((id) => id !== participantId),
    };

    setState((prev) => {
      const exists = prev.sessions.some((s) => s.id === sessionId);
      return {
        ...prev,
        sessions: exists
          ? prev.sessions.map((s) => (s.id === sessionId ? updatedSession : s))
          : [...prev.sessions, updatedSession],
      };
    });

    syncSessionToApi(updatedSession);
  }

  async function addParticipant() {
    if (!newParticipant.nom.trim() || !newParticipant.prenom.trim()) return;
    const participant = {
      ...newParticipant,
      nom: newParticipant.nom.trim().charAt(0).toUpperCase(),
      prenom: newParticipant.prenom.trim(),
    };

    try {
      if (USE_API) {
        setIsSyncing(true);
        const created = await apiFetch("/participants", {
          method: "POST",
          body: JSON.stringify(participant),
        });
        setState((prev) => ({ ...prev, participants: [...prev.participants, created] }));
        setSyncMessage("Participant ajouté via l’API");
      } else {
        setState((prev) => ({
          ...prev,
          participants: [...prev.participants, { ...participant, id: `p-${Date.now()}` }],
        }));
      }
      setNewParticipant({
        nom: "", prenom: "", passport: "sans", cotisation: false, ffme: false, canEncadrer: false, canReferer: false,
      });
    } catch (e) {
      setSyncMessage(`Erreur ajout participant`);
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  }

  async function updateParticipant(id, patch) {
    const previous = state.participants;
    const next = previous.map((p) => (p.id === id ? { ...p, ...patch } : p));
    setState((prev) => ({ ...prev, participants: next }));

    if (!USE_API) return;
    try {
      const target = next.find((p) => p.id === id);
      const updated = await apiFetch(`/participants/${id}`, {
        method: "PUT",
        body: JSON.stringify(target),
      });
      setState((prev) => ({
        ...prev,
        participants: prev.participants.map((p) => (p.id === id ? updated : p)),
      }));
    } catch (e) {
      setState((prev) => ({ ...prev, participants: previous }));
      setSyncMessage("Erreur mise à jour participant");
      console.error(e);
    }
  }

  async function deleteParticipant(id) {
    const previousParticipants = state.participants;
    setState((prev) => ({
      ...prev,
      participants: prev.participants.filter((p) => p.id !== id),
      sessions: prev.sessions.map((s) => ({
        ...s,
        participantIds: s.participantIds.filter((pid) => pid !== id),
        encadrantId: s.encadrantId === id ? null : s.encadrantId,
        referentId: s.referentId === id ? null : s.referentId,
      })),
      realisations: prev.realisations.filter((r) => r.participantId !== id),
    }));

    if (!USE_API) return;
    try {
      await apiFetch(`/participants/${id}`, { method: "DELETE" });
      setSyncMessage("Participant supprimé via l’API");
    } catch (e) {
      setState((prev) => ({ ...prev, participants: previousParticipants }));
      setSyncMessage("Erreur suppression participant");
      console.error(e);
    }
  }

  function addRoute() {
    const numeroVoieUnique = newRoute.numeroVoieUnique.trim();
    const couleurPrises = newRoute.couleurPrises.trim();
    const nomOuvreur = newRoute.nomOuvreur.trim();
    if (!numeroVoieUnique) return setRouteError("Le numéro de voie est obligatoire.");
    if (state.routes.some((r) => r.numeroVoieUnique === numeroVoieUnique)) return setRouteError("Ce numéro de voie existe déjà.");
    if (!couleurPrises || !nomOuvreur) return setRouteError("Renseigne au moins la couleur et l’ouvreur.");

    const route = {
      id: `route-${Date.now()}`,
      numeroVoieUnique,
      numeroCorde: Number(newRoute.numeroCorde),
      couleurPrises,
      cotationReference: newRoute.cotationReference,
      cotationAjustee: newRoute.cotationReference,
      nomVoie: newRoute.nomVoie.trim(),
      nomOuvreur,
      moulinetteOnly: newRoute.moulinetteOnly,
      active: true,
      dateCreation: selectedDate,
    };

    setState((prev) => ({ ...prev, routes: [...prev.routes, route] }));
    setRouteError("");
    setNewRoute({
      numeroVoieUnique: "", numeroCorde: "1", couleurPrises: "", cotationReference: "5c", nomVoie: "", nomOuvreur: "", moulinetteOnly: false,
    });
  }

  function toggleRouteActive(routeId) {
    setState((prev) => ({
      ...prev,
      routes: prev.routes.map((r) => (r.id === routeId ? { ...r, active: !r.active } : r)),
    }));
  }

  function applyAdjustedGrade(routeId) {
    const aggregate = routeAggregatesById[routeId];
    if (!aggregate?.weightedMedianGrade) return;
    setState((prev) => ({
      ...prev,
      routes: prev.routes.map((r) => (r.id === routeId ? { ...r, cotationAjustee: aggregate.weightedMedianGrade } : r)),
    }));
  }

  function addRealisation() {
    const session = sessionsById[newRealisation.sessionId];
    if (!session || !session.participantIds.includes(newRealisation.participantId)) return;
    const realisation = {
      id: `realisation-${Date.now()}`,
      participantId: newRealisation.participantId,
      sessionId: newRealisation.sessionId,
      voieId: newRealisation.voieId,
      dateRealisation: `${session.date}T12:00:00`,
      styleRealisation: newRealisation.styleRealisation,
      commentaire: newRealisation.commentaire,
      cotationProposee: newRealisation.cotationProposee,
      nbEssais: newRealisation.nbEssais,
    };
    setState((prev) => ({ ...prev, realisations: [...prev.realisations, realisation] }));
    setNewRealisation((prev) => ({ ...prev, commentaire: "", cotationProposee: "", nbEssais: "" }));
  }

  function unlockAdmin() {
    if (!/^\d{8}$/.test(adminInput)) return setAdminError("Le code doit contenir 8 chiffres.");
    if (adminInput !== ADMIN_CODE) return setAdminError("Code invalide.");
    setAdminError("");
    setAdminUnlocked(true);
  }

  function exportAllData() {
    downloadFile("climbcrew_export.json", JSON.stringify(state, null, 2));
  }

  async function importJsonFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      setState(parsed);
      setImportMessage("Import JSON réussi.");
    } catch {
      setImportMessage("Import JSON impossible.");
    }
    event.target.value = "";
  }

  function renderSessionCard(session) {
    const inscrits = session.participantIds.map((id) => participantsById[id]).filter(Boolean);
    const occupied = inscrits.length + (session.encadrantId ? 1 : 0) + (session.referentId ? 1 : 0);
    const availableParticipants = state.participants.filter((p) => !session.participantIds.includes(p.id));

    return (
      <div className="card" key={session.id}>
        <div className="card-header">
          <h3>Séance {session.slot}</h3>
          <span className="badge">{occupied}/{MAX_PARTICIPANTS}</span>
        </div>

        <div className="grid two">
          <div>
            <label>Statut</label>
            <select
              value={session.status}
              onChange={(e) => {
                const value = e.target.value;
                updateSession(session.id, {
                  status: value,
                  ...(value !== "encadree" ? { encadrantId: null } : {}),
                  ...(value !== "libre" ? { referentId: null } : {}),
                });
              }}
            >
              <option value="fermee">Fermée</option>
              <option value="libre">Libre</option>
              <option value="encadree">Encadrée</option>
            </select>
          </div>

          {session.status === "encadree" && (
            <div>
              <label>Encadrant</label>
              <select
                value={session.encadrantId || ""}
                onChange={(e) => updateSession(session.id, { encadrantId: e.target.value || null })}
              >
                <option value="">Aucun</option>
                {state.participants.filter((p) => p.canEncadrer).map((p) => (
                  <option key={p.id} value={p.id}>{fullName(p)}</option>
                ))}
              </select>
            </div>
          )}

          {session.status === "libre" && (
            <div>
              <label>Référent</label>
              <select
                value={session.referentId || ""}
                onChange={(e) => updateSession(session.id, { referentId: e.target.value || null })}
              >
                <option value="">Aucun</option>
                {state.participants.filter((p) => p.canReferer).map((p) => (
                  <option key={p.id} value={p.id}>{fullName(p)}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="subcard">
          <label>Ajouter un inscrit</label>
          <select onChange={(e) => addParticipantToSession(session.id, e.target.value)} defaultValue="">
            <option value="" disabled>Choisir un participant</option>
            {availableParticipants.map((p) => (
              <option key={p.id} value={p.id}>{fullName(p)}</option>
            ))}
          </select>
        </div>

        <div className="stack">
          {inscrits.length === 0 ? (
            <div className="muted-box">Aucun inscrit.</div>
          ) : (
            inscrits.map((p) => (
              <div className="participant-row" key={p.id}>
                <span>{fullName(p)}</span>
                <button className="danger ghost" onClick={() => removeParticipantFromSession(session.id, p.id)}>Retirer</button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Inter, Arial, sans-serif; background: #0f172a; color: #e2e8f0; }
        .app { min-height: 100vh; padding: 20px; background: linear-gradient(135deg,#020617,#0f172a,#1e293b); }
        .shell { max-width: 1400px; margin: 0 auto; }
        .hero { background: rgba(15,23,42,.88); border: 1px solid rgba(148,163,184,.25); border-radius: 24px; padding: 22px; box-shadow: 0 20px 60px rgba(0,0,0,.35); }
        .hero h1 { margin: 0; font-size: 32px; }
        .hero p { margin: 8px 0 0; color: #94a3b8; }
        .tabs { display: grid; grid-template-columns: repeat(7, minmax(0,1fr)); gap: 8px; margin-top: 20px; }
        .tab { border: 0; border-radius: 14px; padding: 12px 10px; background: #1e293b; color: #cbd5e1; font-weight: 700; cursor: pointer; }
        .tab.active { background: #22d3ee; color: #082f49; }
        .toolbar, .card { background: rgba(15,23,42,.88); border: 1px solid rgba(148,163,184,.25); border-radius: 20px; padding: 18px; margin-top: 18px; }
        .toolbar-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; }
        .group { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        button, select, input { font: inherit; }
        button { cursor: pointer; border: 0; border-radius: 12px; padding: 10px 14px; font-weight: 700; background: #22d3ee; color: #082f49; }
        button.secondary { background: #334155; color: #e2e8f0; }
        button.ghost { background: transparent; color: #e2e8f0; border: 1px solid rgba(148,163,184,.35); }
        button.danger { background: #ef4444; color: white; }
        input, select { width: 100%; border-radius: 12px; border: 1px solid rgba(148,163,184,.35); background: #0f172a; color: #e2e8f0; padding: 10px 12px; }
        label { display: block; font-size: 12px; font-weight: 700; color: #94a3b8; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .04em; }
        .grid { display: grid; gap: 14px; }
        .grid.two { grid-template-columns: repeat(2,minmax(0,1fr)); }
        .grid.three { grid-template-columns: repeat(3,minmax(0,1fr)); }
        .grid.four { grid-template-columns: repeat(4,minmax(0,1fr)); }
        .grid.five { grid-template-columns: repeat(5,minmax(0,1fr)); }
        .stack { display: grid; gap: 10px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; }
        .card-header h3, .card-header h2 { margin: 0; }
        .badge { display: inline-flex; align-items: center; justify-content: center; min-width: 64px; padding: 6px 10px; border-radius: 999px; border: 1px solid rgba(148,163,184,.35); color: #cbd5e1; }
        .subcard { padding: 12px; border: 1px solid rgba(148,163,184,.25); border-radius: 14px; background: rgba(2,6,23,.45); }
        .muted-box { padding: 14px; border: 1px dashed rgba(148,163,184,.35); border-radius: 14px; color: #94a3b8; }
        .participant-row { display: flex; justify-content: space-between; gap: 10px; align-items: center; padding: 10px 12px; background: rgba(30,41,59,.9); border-radius: 12px; }
        .stats-grid { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap: 12px; }
        .stat { background: rgba(15,23,42,.88); border: 1px solid rgba(148,163,184,.25); border-radius: 18px; padding: 16px; }
        .stat .label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: .04em; }
        .stat .value { margin-top: 10px; font-size: 30px; font-weight: 800; }
        .route-card { color: #111827; border: 1px solid rgba(0,0,0,.1); border-radius: 14px; padding: 12px; }
        .small { font-size: 12px; color: #94a3b8; }
        .success { color: #86efac; }
        .error { color: #fca5a5; }
        .pill { padding: 4px 8px; border-radius: 999px; background: rgba(255,255,255,.35); font-size: 12px; display: inline-flex; align-items: center; }
        .faq-item { padding: 12px 0; border-bottom: 1px solid rgba(148,163,184,.2); }
        @media (max-width: 1100px) {
          .tabs { grid-template-columns: repeat(3,minmax(0,1fr)); }
          .stats-grid, .grid.five, .grid.four, .grid.three, .grid.two { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="shell">
        <div className="hero">
          <h1>ClimbCrew</h1>
          <p>Gestion des séances, des voies, des grimpeurs et de la progression.</p>
          <p className="small">{syncMessage}{isSyncing ? " · sync..." : ""}</p>

          <div className="tabs">
            {["inscriptions","voies","realisations","progression","administration","statistiques","faq"].map((name) => (
              <button key={name} className={`tab ${tab === name ? "active" : ""}`} onClick={() => setTab(name)}>
                {{
                  inscriptions: "Inscriptions",
                  voies: "Voies",
                  realisations: "Réalisations",
                  progression: "Progression",
                  administration: "Administration",
                  statistiques: "Statistiques",
                  faq: "FAQ",
                }[name]}
              </button>
            ))}
          </div>
        </div>

        {tab === "inscriptions" && (
          <>
            <div className="toolbar">
              <div className="toolbar-row">
                <div className="group">
                  <button className="secondary" onClick={() => {
                    const d = viewMode === "jour" ? nextBusinessDay(selectedDate, -1) : nextBusinessDay(nextBusinessDay(nextBusinessDay(nextBusinessDay(nextBusinessDay(selectedDate,-1),-1),-1),-1),-1);
                    setSelectedDate(d); ensureSessionsForDate(d);
                  }}>
                    {viewMode === "jour" ? "Jour précédent" : "Semaine précédente"}
                  </button>

                  <input type="date" value={selectedDate} onChange={(e) => {
                    const v = e.target.value;
                    if (!v || isWeekend(v)) return;
                    setSelectedDate(v); ensureSessionsForDate(v);
                  }} />

                  <button className="secondary" onClick={() => {
                    const d = viewMode === "jour" ? nextBusinessDay(selectedDate, 1) : nextBusinessDay(nextBusinessDay(nextBusinessDay(nextBusinessDay(nextBusinessDay(selectedDate,1),1),1),1),1);
                    setSelectedDate(d); ensureSessionsForDate(d);
                  }}>
                    {viewMode === "jour" ? "Jour suivant" : "Semaine suivante"}
                  </button>
                </div>

                <div className="group">
                  <button className={viewMode === "jour" ? "" : "secondary"} onClick={() => setViewMode("jour")}>Jour</button>
                  <button className={viewMode === "semaine" ? "" : "secondary"} onClick={() => setViewMode("semaine")}>Semaine complète</button>
                </div>
              </div>
            </div>

            {viewMode === "jour" ? (
              <div className="stack">{daySessions.map(renderSessionCard)}</div>
            ) : (
              <div className="grid five">
                {weekSessions.map((day) => (
                  <div className="card" key={day.date}>
                    <div className="card-header"><h3>{formatDateFr(day.date)}</h3></div>
                    <div className="stack">
                      {day.sessions.map((session) => {
                        const inscrits = session.participantIds.map((id) => participantsById[id]).filter(Boolean);
                        const occupied = inscrits.length + (session.encadrantId ? 1 : 0) + (session.referentId ? 1 : 0);
                        return (
                          <div className="subcard" key={session.id}>
                            <div className="card-header">
                              <strong>{session.slot}</strong>
                              <span className="badge">{occupied}/{MAX_PARTICIPANTS}</span>
                            </div>
                            <div className="small">Statut : {session.status}</div>
                            {session.encadrantId && <div className="small">Encadrant : {fullName(participantsById[session.encadrantId])}</div>}
                            {session.referentId && <div className="small">Référent : {fullName(participantsById[session.referentId])}</div>}
                            <div className="stack" style={{ marginTop: 8 }}>
                              {inscrits.length === 0 ? <div className="small">Aucun inscrit</div> : inscrits.map((p) => <div className="participant-row" key={p.id}>{fullName(p)}</div>)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "voies" && (
          <>
            {!adminUnlocked ? (
              <div className="card">
                <div className="card-header"><h2>Accès administration requis</h2></div>
                <div className="grid two">
                  <div>
                    <label>Code administrateur</label>
                    <input type="password" maxLength={8} value={adminInput} onChange={(e) => setAdminInput(e.target.value.replace(/\D/g, "").slice(0, 8))} />
                  </div>
                  <div style={{ display: "flex", alignItems: "end" }}>
                    <button onClick={unlockAdmin}>Déverrouiller</button>
                  </div>
                </div>
                {adminError && <div className="error" style={{ marginTop: 10 }}>{adminError}</div>}
              </div>
            ) : (
              <div className="card">
                <div className="card-header"><h2>Ajouter une voie</h2></div>
                <div className="grid four">
                  <div><label>Numéro unique</label><input value={newRoute.numeroVoieUnique} onChange={(e) => setNewRoute((p) => ({ ...p, numeroVoieUnique: e.target.value }))} /></div>
                  <div><label>Corde</label><select value={newRoute.numeroCorde} onChange={(e) => setNewRoute((p) => ({ ...p, numeroCorde: e.target.value }))}>{state.ropes.map((rope) => <option key={rope.numeroCorde} value={String(rope.numeroCorde)}>Corde {rope.numeroCorde} · {rope.couleurCorde}</option>)}</select></div>
                  <div><label>Couleur voie</label><input value={newRoute.couleurPrises} onChange={(e) => setNewRoute((p) => ({ ...p, couleurPrises: e.target.value }))} /></div>
                  <div><label>Cotation</label><select value={newRoute.cotationReference} onChange={(e) => setNewRoute((p) => ({ ...p, cotationReference: e.target.value }))}>{GRADES.map((g) => <option key={g} value={g}>{g}</option>)}</select></div>
                  <div><label>Nom de la voie</label><input value={newRoute.nomVoie} onChange={(e) => setNewRoute((p) => ({ ...p, nomVoie: e.target.value }))} /></div>
                  <div><label>Ouvreur</label><input value={newRoute.nomOuvreur} onChange={(e) => setNewRoute((p) => ({ ...p, nomOuvreur: e.target.value }))} /></div>
                  <div><label>Moulinette uniquement</label><select value={newRoute.moulinetteOnly ? "oui" : "non"} onChange={(e) => setNewRoute((p) => ({ ...p, moulinetteOnly: e.target.value === "oui" }))}><option value="non">Non</option><option value="oui">Oui</option></select></div>
                  <div style={{ display: "flex", alignItems: "end" }}><button onClick={addRoute}>Ajouter</button></div>
                </div>
                {routeError && <div className="error" style={{ marginTop: 10 }}>{routeError}</div>}
              </div>
            )}

            <div className="card">
              <div className="card-header"><h2>Tableau des voies</h2></div>
              <div className="stack">
                {state.ropes.map((rope) => {
                  const ropeRoutes = state.routes.filter((route) => route.numeroCorde === rope.numeroCorde);
                  return (
                    <div className="subcard" key={rope.numeroCorde}>
                      <div className="card-header">
                        <strong>Corde {rope.numeroCorde} · {rope.couleurCorde}</strong>
                        <span className="badge">{ropeRoutes.length} voie(s)</span>
                      </div>
                      {ropeRoutes.length === 0 ? (
                        <div className="small">Aucune voie sur cette corde.</div>
                      ) : (
                        <div className="stack">
                          {ropeRoutes.map((route) => {
                            const agg = routeAggregatesById[route.id];
                            return (
                              <div className="route-card" key={route.id} style={{ backgroundColor: getRouteBackgroundColor(route.couleurPrises) }}>
                                <div className="card-header">
                                  <strong>{route.cotationAjustee} · {route.nomVoie || "Sans nom"} · {route.nomOuvreur}</strong>
                                  <div className="group">
                                    {route.moulinetteOnly && <span className="pill">Moulinette uniquement</span>}
                                    <span className="pill">{route.active ? "Active" : "Archivée"}</span>
                                    {adminUnlocked && <>
                                      <button className="secondary" onClick={() => toggleRouteActive(route.id)}>{route.active ? "Archiver" : "Réactiver"}</button>
                                      <button className="secondary" disabled={!agg?.weightedMedianGrade} onClick={() => applyAdjustedGrade(route.id)}>Appliquer cotation ajustée</button>
                                    </>}
                                  </div>
                                </div>
                                <div className="small" style={{ color: "#111827" }}>
                                  Réf. {route.cotationReference} · Couleur voie : {route.couleurPrises} · Propositions : {agg?.count || 0} · Médiane : {agg?.medianGrade || "-"} · Médiane pondérée : {agg?.weightedMedianGrade || "-"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {tab === "realisations" && (
          <>
            <div className="card">
              <div className="card-header"><h2>Enregistrer une voie réalisée</h2></div>
              <div className="grid three">
                <div><label>Participant</label><select value={newRealisation.participantId} onChange={(e) => setNewRealisation((p) => ({ ...p, participantId: e.target.value }))}>{state.participants.map((p) => <option key={p.id} value={p.id}>{fullName(p)}</option>)}</select></div>
                <div><label>Séance</label><select value={newRealisation.sessionId} onChange={(e) => setNewRealisation((p) => ({ ...p, sessionId: e.target.value }))}>{state.sessions.map((s) => <option key={s.id} value={s.id}>{s.date} · {s.slot}</option>)}</select></div>
                <div><label>Voie</label><select value={newRealisation.voieId} onChange={(e) => setNewRealisation((p) => ({ ...p, voieId: e.target.value }))}>{state.routes.filter((r) => r.active).map((r) => <option key={r.id} value={r.id}>{r.nomVoie || `#${r.numeroVoieUnique}`} · corde {r.numeroCorde}</option>)}</select></div>
                <div><label>Style</label><select value={newRealisation.styleRealisation} onChange={(e) => setNewRealisation((p) => ({ ...p, styleRealisation: e.target.value }))}>{Object.entries(STYLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
                <div><label>Cotation proposée</label><select value={newRealisation.cotationProposee} onChange={(e) => setNewRealisation((p) => ({ ...p, cotationProposee: e.target.value }))}><option value="">Aucune</option>{GRADES.map((g) => <option key={g} value={g}>{g}</option>)}</select></div>
                <div><label>Essais</label><input type="number" min="1" value={newRealisation.nbEssais} onChange={(e) => setNewRealisation((p) => ({ ...p, nbEssais: e.target.value }))} /></div>
              </div>
              <div style={{ marginTop: 12 }}><label>Commentaire</label><input value={newRealisation.commentaire} onChange={(e) => setNewRealisation((p) => ({ ...p, commentaire: e.target.value }))} /></div>
              <div style={{ marginTop: 12 }}><button onClick={addRealisation}>Enregistrer la réalisation</button></div>
            </div>

            <div className="card">
              <div className="card-header"><h2>Historique des réalisations</h2></div>
              <div className="stack">
                {state.realisations.length === 0 ? <div className="muted-box">Aucune réalisation enregistrée.</div> : [...state.realisations]
                  .sort((a, b) => b.dateRealisation.localeCompare(a.dateRealisation))
                  .map((realisation) => {
                    const participant = participantsById[realisation.participantId];
                    const route = routesById[realisation.voieId];
                    const session = sessionsById[realisation.sessionId];
                    return (
                      <div className="subcard" key={realisation.id}>
                        <strong>{fullName(participant)} — {route?.nomVoie || `#${route?.numeroVoieUnique}`}</strong>
                        <div className="small">{session?.date} · {session?.slot} · {STYLE_LABELS[realisation.styleRealisation]}</div>
                        <div className="small">Cotation proposée : {realisation.cotationProposee || "-"} · Essais : {realisation.nbEssais || "-"}</div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </>
        )}

        {tab === "progression" && (
          <div className="card">
            <div className="card-header"><h2>Suivi individuel</h2></div>
            <div style={{ maxWidth: 320 }}>
              <label>Choisir un grimpeur</label>
              <select value={state.selectedParticipantProgress || ""} onChange={(e) => setState((prev) => ({ ...prev, selectedParticipantProgress: e.target.value }))}>
                {state.participants.map((p) => <option key={p.id} value={p.id}>{fullName(p)}</option>)}
              </select>
            </div>

            <div className="stats-grid" style={{ marginTop: 14 }}>
              <div className="stat"><div className="label">Voies réalisées</div><div className="value">{participantProgressStats.count}</div></div>
              <div className="stat"><div className="label">Meilleure cotation</div><div className="value">{participantProgressStats.bestAll || "-"}</div></div>
              <div className="stat"><div className="label">Meilleure cotation propre</div><div className="value">{participantProgressStats.bestClean || "-"}</div></div>
              <div className="stat"><div className="label">CPR actuel</div><div className="value">{participantProgressStats.cpr.currentGrade || "-"}</div></div>
              <div className="stat"><div className="label">Réalisations prises en compte</div><div className="value">{participantProgressStats.cpr.timeline.length}</div></div>
            </div>

            <div className="card" style={{ marginTop: 16, background: "rgba(14,165,233,.10)" }}>
              <div className="card-header"><h3>Timeline CPR simplifiée</h3></div>
              <div className="stack">
                {participantProgressStats.cpr.timeline.length === 0 ? <div className="muted-box">Pas assez de données pour afficher une timeline CPR.</div> :
                  participantProgressStats.cpr.timeline.map((item, index) => (
                    <div className="subcard" key={`${item.date}-${index}`}>
                      <strong>{formatDateFr(item.date.slice(0, 10))}</strong>
                      <div className="small">Cotation : {item.grade} · Indice pondéré : {item.weightedIndex.toFixed(2)}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {tab === "administration" && (
          <>
            {!adminUnlocked ? (
              <div className="card">
                <div className="card-header"><h2>Accès administration</h2></div>
                <div className="grid two">
                  <div>
                    <label>Code administrateur</label>
                    <input type="password" maxLength={8} value={adminInput} onChange={(e) => setAdminInput(e.target.value.replace(/\D/g, "").slice(0, 8))} />
                    <div className="small">Code par défaut : 12345678</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "end" }}><button onClick={unlockAdmin}>Déverrouiller</button></div>
                </div>
                {adminError && <div className="error" style={{ marginTop: 10 }}>{adminError}</div>}
              </div>
            ) : (
              <>
                <div className="card">
                  <div className="card-header">
                    <h2>Ajouter un participant</h2>
                    <button className="secondary" onClick={() => setAdminUnlocked(false)}>Verrouiller</button>
                  </div>
                  <div className="grid four">
                    <div><label>Nom (anonymisé à l’ajout)</label><input value={newParticipant.nom} onChange={(e) => setNewParticipant((p) => ({ ...p, nom: e.target.value }))} /></div>
                    <div><label>Prénom</label><input value={newParticipant.prenom} onChange={(e) => setNewParticipant((p) => ({ ...p, prenom: e.target.value }))} /></div>
                    <div><label>Passeport</label><select value={newParticipant.passport} onChange={(e) => setNewParticipant((p) => ({ ...p, passport: e.target.value }))}><option value="sans">Sans</option><option value="jaune">Jaune</option><option value="orange">Orange</option><option value="vert">Vert</option><option value="decouverte">Découverte</option></select></div>
                    <div style={{ display: "flex", alignItems: "end" }}><button onClick={addParticipant}>Ajouter</button></div>
                  </div>
                  <div className="group" style={{ marginTop: 12 }}>
                    <label><input type="checkbox" checked={newParticipant.cotisation} onChange={(e) => setNewParticipant((p) => ({ ...p, cotisation: e.target.checked }))} /> Cotisation</label>
                    <label><input type="checkbox" checked={newParticipant.ffme} onChange={(e) => setNewParticipant((p) => ({ ...p, ffme: e.target.checked }))} /> FFME</label>
                    <label><input type="checkbox" checked={newParticipant.canEncadrer} onChange={(e) => setNewParticipant((p) => ({ ...p, canEncadrer: e.target.checked }))} /> Encadrant</label>
                    <label><input type="checkbox" checked={newParticipant.canReferer} onChange={(e) => setNewParticipant((p) => ({ ...p, canReferer: e.target.checked }))} /> Référent</label>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><h2>Gestion des participants</h2></div>
                  <div className="stack">
                    {state.participants.map((p) => (
                      <div className="subcard" key={p.id}>
                        <div className="grid four">
                          <div><label>Nom</label><input value={p.nom} onChange={(e) => updateParticipant(p.id, { nom: e.target.value })} /></div>
                          <div><label>Prénom</label><input value={p.prenom} onChange={(e) => updateParticipant(p.id, { prenom: e.target.value })} /></div>
                          <div><label>Passeport</label><select value={p.passport} onChange={(e) => updateParticipant(p.id, { passport: e.target.value })}><option value="sans">Sans</option><option value="jaune">Jaune</option><option value="orange">Orange</option><option value="vert">Vert</option><option value="decouverte">Découverte</option></select></div>
                          <div style={{ display: "flex", alignItems: "end" }}><button className="danger" onClick={() => deleteParticipant(p.id)}>Supprimer</button></div>
                        </div>
                        <div className="group" style={{ marginTop: 12 }}>
                          <label><input type="checkbox" checked={p.cotisation} onChange={(e) => updateParticipant(p.id, { cotisation: e.target.checked })} /> Cotisation</label>
                          <label><input type="checkbox" checked={p.ffme} onChange={(e) => updateParticipant(p.id, { ffme: e.target.checked })} /> FFME</label>
                          <label><input type="checkbox" checked={p.canEncadrer} onChange={(e) => updateParticipant(p.id, { canEncadrer: e.target.checked })} /> Encadrant</label>
                          <label><input type="checkbox" checked={p.canReferer} onChange={(e) => updateParticipant(p.id, { canReferer: e.target.checked })} /> Référent</label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><h2>Import / export</h2></div>
                  <div className="group">
                    <button className="secondary" onClick={exportAllData}>Export JSON</button>
                    <label className="pill" style={{ cursor: "pointer" }}>
                      Import JSON
                      <input type="file" accept=".json,application/json" style={{ display: "none" }} onChange={importJsonFile} />
                    </label>
                  </div>
                  {importMessage && <div className="success" style={{ marginTop: 10 }}>{importMessage}</div>}
                </div>
              </>
            )}
          </>
        )}

        {tab === "statistiques" && (
          <>
            <div className="stats-grid">
              <div className="stat"><div className="label">Inscrits uniques</div><div className="value">{sessionStats.nombreInscrits}</div></div>
              <div className="stat"><div className="label">Cotisations</div><div className="value">{sessionStats.nombreCotisations}</div></div>
              <div className="stat"><div className="label">FFME</div><div className="value">{sessionStats.nombreFFME}</div></div>
              <div className="stat"><div className="label">Voies actives</div><div className="value">{sessionStats.nombreVoiesActives}</div></div>
              <div className="stat"><div className="label">Réalisations</div><div className="value">{sessionStats.nombreRealisations}</div></div>
            </div>

            <div className="card">
              <div className="card-header"><h2>Liste des inscrits</h2></div>
              <div className="stack">
                {sessionStats.sortedParticipants.map((participant) => (
                  <div className="participant-row" key={participant.id}>
                    <span>{fullName(participant)}</span>
                    <span className="small">Cotisation : {participant.cotisation ? "Oui" : "Non"} · FFME : {participant.ffme ? "Oui" : "Non"} · Participations : {sessionStats.participationCount[participant.id] || 0} · Passeport : {participant.passport}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "faq" && (
          <div className="card">
            <div className="card-header"><h2>FAQ – fonctionnement du site</h2></div>
            <div className="faq-item"><strong>À quoi sert ClimbCrew ?</strong><div className="small">À gérer les séances, les participants, les voies et la progression des grimpeurs.</div></div>
            <div className="faq-item"><strong>Comment fonctionnent les inscriptions ?</strong><div className="small">Les grimpeurs s’ajoutent sur une séance midi ou soir. La capacité maximale est de 18 personnes encadrement compris.</div></div>
            <div className="faq-item"><strong>Qui peut modifier les voies ?</strong><div className="small">Uniquement un administrateur connecté avec le code à 8 chiffres.</div></div>
            <div className="faq-item"><strong>Comment suivre la progression ?</strong><div className="small">L’onglet Progression calcule un CPR simplifié basé sur les réalisations récentes et leur style.</div></div>
            <div className="faq-item"><strong>Comment sauvegarder les données ?</strong><div className="small">L’application sauvegarde automatiquement dans le navigateur. Avec le backend, les participants sont partagés via l’API.</div></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
