# -*- coding: utf-8 -*-
"""
Created on Mon Sep 20 14:51:00 2021

@author: lovro
@version 0.3.3
"""
from os.path import join
from glob import glob
##import os

N_files = 12

# Directory = 'C:/Users/lovro/OneDrive/Pictures/Games Screens/Done'
# Directory = 'C:/Users/lovro/OneDrive/Pictures/Games Screens/Done_decals'
# Directory = 'C:/Users/lovro/OneDrive/Pictures/Games Screens/Gates'

Directory = 'C:/Users/Uporabnik/Downloads/Converted_AI_pic'
# Directory = 'C:/Users/Uporabnik/Documents/JS/HauntingTheHauntessa/Assets/Graphics/Textures/Wall'
# Directory = 'C:/Users/Uporabnik/Documents/JS/HauntingTheHauntessa/Assets/Graphics/Sprites/Lights'
# Directory = 'C:/Users/Uporabnik/Documents/JS/HauntingTheHauntessa/Assets/Graphics/Sprites/ObjDecals'
# Directory = 'C:/Users/Uporabnik/Documents/JS/HauntingTheHauntessa/Assets/Graphics/Sprites/PicDecals'
# Directory = 'C:/Users/Uporabnik/Documents/JS/HauntingTheHauntessa/Assets/Graphics/Sprites/Scrolls'
# Directory = 'C:/Users/Uporabnik/Documents/JS/HauntingTheHauntessa/Assets/Graphics/Sprites/Lairs'
# Directory = 'C:/Users/Uporabnik/Downloads/ObjDecals'
# Directory = 'C:/Users/Uporabnik/Downloads/Lair'

# Prefix = ''
# Prefix = 'Items/'
# Prefix = 'MaskElements/'
Prefix = 'MaskDecals/'
# Prefix = 'Wall/'
# Prefix = "Lights/"
# Prefix = "Lairs/"
# Prefix = "PicDecals/"
# Prefix = "Panorama/"
# Prefix = "Arch/"
# Prefix = "Sky/"
# Prefix = "Scrolls/"
# Prefix = "ObjDecals/"
# Prefix = "ObjectTextures/"
# Prefix = 'Lairs/'
# Prefix = ''

files = []
ext = ['*.png', '*.jpg', '*.webp']
# rotate = "count: 1, rotate: { first: 0, last: 350, step: 10 } "
# template = '{ srcName: {}, name: {} },\n'

for e in ext:
    files.extend(glob(join(Directory, e)))

files = sorted([f.split('\\')[1] for f in files])
assets = [f'{{ srcName: "{Prefix}{f}", name: "{f.split(".")[0]}"}},' for f in files]
# assets = [f'{{ srcName: "{Prefix}{f}", name: "{f.split(".")[0]}", {rotate} }},' for f in files]
assetText = "\n".join(assets)
# nameText = ",".join([f'"{f.split(".")[0]}"' for f in files])
name_chunks = [",".join([f'"{f.split(".")[0]}"' for f in files[i:i+N_files]]) for i in range(0, len(files), N_files)]
nameText = ",\n".join(name_chunks)

