# -*- coding: utf-8 -*-
"""
Created on Thu Sep 24 10:34:20 2026

@author: Uporabnik
"""

from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

for src in Path(".").glob("DungeonDoor_*.webp"):
    if src.stem.endswith("_clean"):
        continue

    rgba = np.array(Image.open(src).convert("RGBA"))
    alpha = rgba[:, :, 3]

    labels, count = ndi.label(
        alpha >= 222,
        structure=np.ones((3, 3), dtype=bool)
    )
    if count == 0:
        print(f"Skipped {src}: no solid region")
        continue

    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    solid = labels == sizes.argmax()

    distance, nearest = ndi.distance_transform_edt(
        ~solid, return_indices=True
    )
    alpha[distance > 1.0] = 0

    transparent = alpha == 0
    rgba[transparent, :3] = rgba[
        nearest[0][transparent],
        nearest[1][transparent],
        :3
    ]

    Image.fromarray(rgba, "RGBA").save(
        src.with_suffix(".clean.png")
    )