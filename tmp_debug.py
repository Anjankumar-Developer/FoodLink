import csv, re
from pathlib import Path
p = Path(r'd:\Projects\FoodLink\datasets\Datasets\recipients.csv')
valid = 0
invalid = 0
with p.open('r', encoding='utf-8-sig', newline='') as f:
    reader = csv.DictReader(f)
    for row in reader:
        recipient_id = row.get('recipient_id')
        if recipient_id:
            m = re.search(r'[\d]+$', recipient_id)
            if m:
                valid += 1
            else:
                invalid += 1
        else:
            invalid += 1
print('valid', valid, 'invalid', invalid)
print('first 10 ids', [row.get('recipient_id') for row in csv.DictReader(open(p, 'r', encoding='utf-8-sig', newline=''))][:10])
