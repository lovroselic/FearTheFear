# -*- coding: utf-8 -*-
"""
Created on Wed Oct 14 17:25:48 2026

@author: Uporabnik
"""

import sys
import pandas as pd
from importlib.metadata import version

print("Python:", sys.executable)
print("pandas:", pd.__version__)
print("pandas location:", pd.__file__)
print("NumPy:", version("numpy"))
print("spyder-kernels:", version("spyder-kernels"))

df_test = pd.DataFrame({"a": [1, 2, 3]})