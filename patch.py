with open('src/components/dashboard/Transfers.tsx', 'r') as f:
    lines = f.readlines()

# delete lines 96-124 (indices 95 to 123)
del lines[95:124]

with open('src/components/dashboard/Transfers.tsx', 'w') as f:
    f.writelines(lines)
