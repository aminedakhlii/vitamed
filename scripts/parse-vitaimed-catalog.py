#!/usr/bin/env python3
"""Parse VITAIMED catalogue PDF (from page 14) into product JSON."""
import json
import re
from pathlib import Path
from pypdf import PdfReader

PDF = Path(__file__).resolve().parent.parent / "VITAIMED--Catalogue.pdf"
OUT = Path(__file__).resolve().parent.parent / "prisma" / "vitaimed-products.json"
START_PAGE = 14  # 1-based

REF_RE = re.compile(r"^Ref\.\s*No\.\s*:\s*(.+)$", re.I)
DESC_RE = re.compile(r"^Description:\s*(.*)$", re.I)
CAP_RE = re.compile(r"^Capacity:\s*(.+)$", re.I)
ITEM_RE = re.compile(r"^Item\s*No\.\s+(\S+)", re.I)
PACK_RE = re.compile(r"(\d+)\s*pcs/(?:carton|box)", re.I)
REF_INLINE = re.compile(
    r"^Ref\.\s*No\.\s*:\s*(\S+)\s+Capacity:\s*(.+)$", re.I
)
# Table row: CODE ... numbers ... feature ... units
TABLE_REF = re.compile(
    r"^(KY[A-Z0-9]+(?:-[A-Z0-9]+)?|CAPD\d+|GV\d+|KB\d+ML|VTLEC|VTSSEC|VTSEC)\b",
    re.I,
)
KB_REF = re.compile(r"^(KB\d+ML)\s+(\d+ml)\s+", re.I)
OSTOMY_ITEM = re.compile(
    r"Item\s*No\.\s+(\S+).*?Max\s*Cut\s+(\d+mm).*?Package\s*Qty\s+(\d+pcs/\w+).*?(?:Deodoriz\w+|Deodorization)\s+(\S+(?:\s+\S+)?).*?Baseplate\s+(.+?)\s+Sealing\s+(.+?)(?:\n|$)",
    re.S | re.I,
)

SKIP_LINES = {
    "hot", "sales", "new arrival", "instructions for use", "illustration",
    "reference", "packaging", "various styles", "dehp free", "patents",
}


def clean(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def is_noise(line: str) -> bool:
    l = line.lower().strip()
    if not l or l.startswith("—") or l.startswith("<<<"):
        return True
    if re.match(r"^[\d\s\.•]+$", l):
        return True
    if any(x in l for x in ("page", "hot sales", "new arrival")):
        return True
    return False


def detect_category(line: str, current: str) -> str:
    u = line.upper().strip()
    if len(u) < 3 or len(u) > 80:
        return current
  # Section headers
    headers = [
        ("URINE METER", "Urine Meters"),
        ("URINE BAG", "Urinary Drainage Bags"),
        ("ECONOMIC URINE BAG", "Economic Urine Bags"),
        ("EXTERNAL MALE", "Male External Catheters"),
        ("BLADDER IRRIGATION", "Bladder Irrigation Sets"),
        ("BILE BAG", "Bile Bags"),
        ("PERITONEAL DIALYSIS", "Peritoneal Dialysis"),
        ("OSTOMY", "Ostomy Care"),
        ("LARYNGOSCOPE", "Laryngoscopes"),
    ]
    for key, cat in headers:
        if key in u and len(u) < 60:
            return cat
    if u == "URINARY DRAINAGE BAG":
        return "Urinary Drainage Bags"
    if "VIURO" in u and "SYSTEM" in u:
        return "Urine Meters"
    if u.startswith("TILTING SYSTEMS"):
        return "Urine Meters - Tilting Systems"
    if u.startswith("EXCHANGE BAG"):
        return "Urine Meters - Exchange Bags"
    if "FILTRATE BAG" in u:
        return "Peritoneal Dialysis"
    return current


def parse_block_features(lines: list[str]) -> tuple[str, list[str], str | None]:
    """Return description text, feature bullets, pack info."""
    feats = []
    desc_parts = []
    pack = None
    for ln in lines:
        if PACK_RE.search(ln):
            pack = ln.strip()
        elif CAP_RE.match(ln):
            desc_parts.append(ln.strip())
        elif REF_RE.match(ln) or DESC_RE.match(ln):
            continue
        elif len(ln) > 2 and not is_noise(ln):
            if re.match(r"^[A-Z]{2,5}\d", ln):  # stray codes
                continue
            feats.append(ln.strip())
    return " ".join(desc_parts), feats, pack


def main():
    reader = PdfReader(str(PDF))
    text_parts = []
    for i in range(START_PAGE - 1, len(reader.pages)):
        t = reader.pages[i].extract_text() or ""
        text_parts.append(t)
    full_text = "\n".join(text_parts)

    products: dict[str, dict] = {}
    category = "VITAIMED Medical Devices"

    def add(code: str, name: str, desc: str, feats: list, cap: str = "", pack: str = "", cat: str = ""):
        code = clean(code)
        if not code or len(code) > 40:
            return
        if code.lower() in ("reference", "exchange", "description"):
            return
        name = clean(name) or code
        cat_use = cat or category
        key = code.upper()
        if key in products:
            # merge features
            existing = products[key]
            existing["features"] = list(dict.fromkeys(existing["features"] + feats))
            return
        products[key] = {
            "code": key,
            "name": name[:200],
            "category": cat_use,
            "description": clean(desc)[:2000] if desc else name,
            "capacity": cap,
            "packaging": pack,
            "features": feats[:30],
        }

    lines = full_text.split("\n")
    i = 0
    pending_name = ""
    section_name = ""

    while i < len(lines):
        line = lines[i].strip()
        category = detect_category(line, category)

        if line.startswith("Exchange Bag for") or line.startswith("Exchange Bag（"):
            section_name = clean(line)
            i += 1
            continue

        # Item No. ostomy blocks (multiline)
        if ITEM_RE.match(line):
            block = line
            j = i + 1
            while j < min(i + 12, len(lines)) and not ITEM_RE.match(lines[j]) and not lines[j].startswith("Item No."):
                if lines[j].strip():
                    block += "\n" + lines[j]
                j += 1
            m = re.search(r"Item\s*No\.\s+(\S+)", block, re.I)
            if m:
                code = m.group(1)
                max_cut = re.search(r"Max\s*Cut\s+(\d+mm)", block, re.I)
                pkg = re.search(r"Package\s*Qty\s+(\S+)", block, re.I)
                deo = re.search(r"Deodoriz\w+\s+(.+?)(?:\n|Baseplate)", block, re.I | re.S)
                base = re.search(r"Baseplate\s+(.+?)(?:\n|Sealing)", block, re.I | re.S)
                seal = re.search(r"Sealing\s+(.+?)(?:\n|$)", block, re.I)
                feats = []
                if max_cut:
                    feats.append(f"Max cut: {max_cut.group(1)}")
                if deo:
                    feats.append(f"Deodorization: {clean(deo.group(1))}")
                if base:
                    feats.append(f"Baseplate: {clean(base.group(1))}")
                if seal:
                    feats.append(f"Sealing: {clean(seal.group(1))}")
                # product type from preceding context in block
                type_hint = "Ostomy Pouch"
                if "Urostomy" in block:
                    type_hint = "One-piece Urostomy System"
                elif "Kid" in block:
                    type_hint = "One-piece Colostomy System for Kids"
                elif "Closed" in block:
                    type_hint = "One-piece Colostomy Closed System"
                elif "Convex" in block:
                    type_hint = "One-piece Colostomy Convex System"
                name = f"Vistoma {type_hint} — {code}"
                add(code, name, name, feats, pack=pkg.group(1) if pkg else "", cat="Ostomy Care")
            i = j
            continue

        # KB bile bags
        kb = KB_REF.match(line)
        if kb:
            code, cap = kb.group(1).upper(), kb.group(2)
            add(code, f"Bile Bag {cap}", f"VITAIMED bile collection bag, {cap}.", ["PVC bag", "80cm inlet tubing", "Anti-Reflux Valve", "Cross Valve"], cap, cat="Bile Bags")
            i += 1
            continue

        # Inline ref + capacity
        m_inline = REF_INLINE.match(line)
        if m_inline:
            code, cap = m_inline.group(1), m_inline.group(2)
            add(code, f"Pediatric Urinary Collection Bag {code}", f"Capacity: {cap}", [], cap, cat="Economic Urine Bags")
            i += 1
            continue

        # Description block
        m_desc = DESC_RE.match(line)
        if m_desc:
            name_part = m_desc.group(1).strip()
            block_lines = []
            ref_code = ""
            cap = ""
            j = i + 1
            if name_part:
                pending_name = name_part
            while j < len(lines):
                nl = lines[j].strip()
                if DESC_RE.match(nl) and j > i + 1:
                    break
                rm = REF_RE.match(nl)
                if rm:
                    ref_code = rm.group(1).strip()
                    j += 1
                    break
                if nl and not REF_RE.match(nl):
                    block_lines.append(nl)
                j += 1

            if ref_code:
                # collect until pack or next description/ref
                feat_lines = []
                while j < len(lines):
                    nl = lines[j].strip()
                    if DESC_RE.match(nl) or (REF_RE.match(nl) and j > i + 2):
                        break
                    if REF_INLINE.match(nl):
                        break
                    if nl:
                        cm = CAP_RE.match(nl)
                        if cm:
                            cap = cm.group(1)
                        elif PACK_RE.search(nl):
                            pack = nl
                            feat_lines.append(nl)
                            j += 1
                            break
                        elif not is_noise(nl):
                            feat_lines.append(nl)
                    j += 1
                name = pending_name or section_name or f"VITAIMED {ref_code}"
                if name.lower() == "filtrate bag":
                    name = f"Peritoneal Dialysis Filtrate Bag {ref_code}"
                add(ref_code, name, name, feat_lines, cap, pack if 'pack' in dir() else "", category)
                pending_name = ""
            i = j
            continue

        # Standalone Ref. No.
        m_ref = REF_RE.match(line)
        if m_ref:
            ref_code = m_ref.group(1).strip()
            feat_lines = []
            cap = ""
            pack = ""
            j = i + 1
            while j < len(lines):
                nl = lines[j].strip()
                if REF_RE.match(nl) or DESC_RE.match(nl):
                    break
                if ITEM_RE.match(nl):
                    break
                cm = CAP_RE.match(nl)
                if cm:
                    cap = cm.group(1)
                elif PACK_RE.search(nl):
                    pack = nl
                    feat_lines.append(nl)
                    j += 1
                    break
                elif nl and not is_noise(nl) and not re.match(r"^KY[A-Z0-9]", nl):
                    feat_lines.append(nl)
                j += 1
            # infer name from features or category
            name = pending_name or section_name
            if not name or name.lower() == "description":
                if feat_lines:
                    name = feat_lines[0][:80]
                else:
                    name = f"{category} {ref_code}"
            if ref_code == "KYD04" and not pending_name:
                name = "Single-chamber Urine Meter"
            add(ref_code, name, clean(" ".join(feat_lines[:3])), feat_lines, cap, pack, category)
            pending_name = ""
            i = j
            continue

        # Reference table rows (variant SKUs)
        if re.match(r"^(KY[A-Z0-9]{2,}(?:-[A-Z0-9]+)?)\s+\d", line, re.I):
            parts = re.split(r"\s{2,}|\t", line)
            code = parts[0].strip()
            if "-" in code or code.endswith("EBF") or re.search(r"[A-Z]$", code):
                rest = line[len(code):].strip()
                nums = re.findall(r"\d+", rest)
                feats = [rest] if rest else []
                parent = code.split("-")[0]
                name = f"{section_name or category} — {code}" if section_name else f"Variant {code}"
                add(code, name, f"Catalogue reference {code}.", feats, cat=category)
            i += 1
            continue

        # KYE reference table
        if re.match(r"^KYE\d{2}(?:-\d+)?(?:-\d+)?\s*$", line, re.I):
            code = line.strip()
            add(code, f"Urine Bag with Straps {code}", f"Economic urine bag variant {code}.", [], cat="Economic Urine Bags")
            i += 1
            continue

        # Male catheter size rows -> group under VTLEC/VTSSEC (add parent products once)
        if re.match(r"^(Standard-\d+|20|25|29|32|36|41)\s+Box", line, re.I):
            i += 1
            continue

        i += 1

    # Ensure main catalogue products from explicit descriptions (backup list)
    catalogue_main = [
        ("KYD01", "Triple-chamber Urine Meter", "Urine Meters"),
        ("KYD02", "Double-chamber Urine Meter", "Urine Meters"),
        ("KYD03", "Single-chamber Urine Meter", "Urine Meters"),
        ("KYD04", "Single-chamber Urine Meter 500ml+2000ml", "Urine Meters"),
        ("KYD04-1", "Single-chamber Urine Meter 500ml+2600ml", "Urine Meters - Tilting Systems"),
        ("KYD06", "Single-chamber Urine Meter 200ml+2000ml", "Urine Meters"),
        ("KYD09", "ViUro 500 Classic", "Urine Meters"),
        ("KYD10", "ViUro 500 Plus", "Urine Meters"),
        ("KYD11", "ViUro 500 Pro", "Urine Meters"),
        ("KYD12", "ViUro 500 Smart", "Urine Meters"),
        ("KYC01", "Urinary Drainage Bag with Exercise Bulb", "Urinary Drainage Bags"),
        ("KYC02", "Urinary Drainage Bag — Single Hook", "Urinary Drainage Bags"),
        ("KYC03", "Urinary Drainage Bag — Double Hook", "Urinary Drainage Bags"),
        ("KYC04", "Urinary Drainage Bag — Single Hook T-Tap", "Urinary Drainage Bags"),
        ("KYC05", "Urinary Drainage Bag with Exercise Bulb 150cm", "Urinary Drainage Bags"),
        ("KYC07", "Urinary Drainage Bag — Cross Outlet", "Urinary Drainage Bags"),
        ("KYC08", "Urinary Drainage Bag 5000ml", "Urinary Drainage Bags"),
        ("KYB01", "Economic Urine Bag — Pull valve", "Economic Urine Bags"),
        ("KYB03", "Economic Urine Bag — Cross valve", "Economic Urine Bags"),
        ("KYB04", "Economic Urine Bag — Without outlet", "Economic Urine Bags"),
        ("KYB07", "Economic Urine Bag 4000ml — Screw valve", "Economic Urine Bags"),
        ("KYB13", "Economic Urine Bag — PVC Strip Hanger", "Economic Urine Bags"),
        ("KYB15", "Economic Urine Bag — Sampling port", "Economic Urine Bags"),
        ("KYE01", "Urine Bag with Straps 750ml", "Economic Urine Bags"),
        ("KYA01-1", "Pediatric Urinary Collection Bag — Open side", "Pediatric Urine Bags"),
        ("KYA02-1", "Pediatric Urinary Collection Bag — Anti-Reflux", "Pediatric Urine Bags"),
        ("GV001", "Laryngoscope — Lock type", "Laryngoscopes"),
        ("GV002", "Laryngoscope — Threaded Rod locking", "Laryngoscopes"),
        ("GV003", "Laryngoscope — Pole type", "Laryngoscopes"),
        ("GV004", "Laryngoscope — Middle screw type", "Laryngoscopes"),
        ("GV005", "Laryngoscope — Side screw type", "Laryngoscopes"),
        ("GV007", "Laryngoscope — American type w/ light", "Laryngoscopes"),
        ("GV008", "Laryngoscope — Pull-push type", "Laryngoscopes"),
        ("GV009", "Laryngoscope — Middle screw mist absorption", "Laryngoscopes"),
        ("GV010", "Laryngoscope — Pole type w/ light source", "Laryngoscopes"),
        ("GV011", "Laryngoscope — Brazil type", "Laryngoscopes"),
        ("KY-IR-6-1", "Two Lead TUR Irrigation Set", "Bladder Irrigation Sets"),
        ("KY-IR-6-2", "Four Lead Arthroscopic Irrigation Set", "Bladder Irrigation Sets"),
        ("KY-IR-6-3", "Four Lead Arthroscopic Irrigation Set (short)", "Bladder Irrigation Sets"),
        ("KY-IR-6-4", "Y-type TUR Irrigation Set", "Bladder Irrigation Sets"),
        ("KY-IR-6-5", "Cysto/Bladder Irrigation Set", "Bladder Irrigation Sets"),
        ("KY-IR-6-6", "Cysto/Bladder Irrigation Set (compact)", "Bladder Irrigation Sets"),
        ("CAPD01", "Peritoneal Dialysis Filtrate Bag — Luer", "Peritoneal Dialysis"),
        ("CAPD02", "Peritoneal Dialysis Filtrate Bag — Breakable valve", "Peritoneal Dialysis"),
        ("CAPD03", "Peritoneal Dialysis Filtrate Bag", "Peritoneal Dialysis"),
        ("CAPD04", "Peritoneal Dialysis Filtrate Bag 10L", "Peritoneal Dialysis"),
        ("VTLEC", "Latex External Catheter", "Male External Catheters"),
        ("VTSSEC", "Silicone External Catheter — Self-adhesive", "Male External Catheters"),
        ("VTSEC", "Silicone External Catheter — Adhesive tape", "Male External Catheters"),
    ]
    name_overrides = {code.upper(): (name, cat) for code, name, cat in catalogue_main}
    for code, (name, cat) in name_overrides.items():
        if code in products:
            products[code]["name"] = name
            products[code]["category"] = cat
            if products[code]["description"].startswith("Exchange Bag") or len(products[code]["description"]) < 30:
                products[code]["description"] = f"VITAIMED {name}. See VITAIMED catalogue."
        else:
            products[code] = {
                "code": code,
                "name": name,
                "category": cat,
                "description": f"VITAIMED {name}. See VITAIMED catalogue.",
                "capacity": "",
                "packaging": "",
                "features": ["DEHP Free (selectable)", "VITAIMED catalogue product"],
            }

    # Exchange bag variants
    for code, parent in [
        ("KYD09EBF", "KYD09"), ("KYD09EBF-1", "KYD09"), ("KYD09-B", "KYD09"), ("KYD09-C", "KYD09"), ("KYD09-D", "KYD09"),
        ("KYD10EBF", "KYD10"), ("KYD10EBF-1", "KYD10"), ("KYD10-C", "KYD10"),
        ("KYD11EBF", "KYD11"), ("KYD11EBF-1", "KYD11"), ("KYD11-C", "KYD11"), ("KYD11-D", "KYD11"),
        ("KYD12EBF", "KYD12"), ("KYD12EBF-1", "KYD12"), ("KYD12-C", "KYD12"), ("KYD12-D", "KYD12"),
    ]:
        if code.upper() not in products:
            pname = products.get(parent, {}).get("name", parent)
            products[code.upper()] = {
                "code": code.upper(),
                "name": f"Exchange Bag / Variant for {pname} ({code})",
                "category": "Urine Meters - Exchange Bags",
                "description": f"Exchange bag or configuration variant {code} for {pname}.",
                "capacity": "",
                "packaging": "10 pcs/carton",
                "features": ["Cross valve outlet", "Compatible with ViUro system"],
            }

    def category_for_code(code: str) -> str:
        c = code.upper()
        if c.startswith("KYD"):
            return "Urine Meters - Exchange Bags" if "EBF" in c or re.search(r"-[A-Z]$", c) else "Urine Meters"
        if c.startswith("KYC"):
            return "Urinary Drainage Bags"
        if c.startswith("KYB") or c.startswith("KYE") or c.startswith("KYA"):
            return "Economic Urine Bags" if c.startswith("KYB") or c.startswith("KYE") else "Pediatric Urine Bags"
        if c.startswith("KY-IR"):
            return "Bladder Irrigation Sets"
        if c.startswith("CAPD"):
            return "Peritoneal Dialysis"
        if c.startswith("KB"):
            return "Bile Bags"
        if c.startswith("GV"):
            return "Laryngoscopes"
        if c.startswith("VT"):
            return "Male External Catheters"
        if re.match(r"^[C]?\d", c) or c.startswith("C"):
            return "Ostomy Care"
        return category

    # Second pass: all Item No. blocks (ostomy + two-piece)
    for m in re.finditer(
        r"Item\s*No\.\s+(\S+)([\s\S]*?)(?=Item\s*No\.|—\s*\d+\s*—|<<<PAGE|\Z)",
        full_text,
        re.I,
    ):
        code = m.group(1).strip()
        block = m.group(0)
        if code.upper() in products:
            continue
        max_cut = re.search(r"Max\s*Cut\s+(\d+\s*mm)", block, re.I)
        capicity = re.search(r"Capici\w+\s+(\S+)", block, re.I)
        pkg = re.search(r"Package\s*Qty\s+(\S+)", block, re.I)
        deo = re.search(r"Deodoriz\w+\s+([^\n]+)", block, re.I)
        base = re.search(r"Baseplate\s+([^\n]+)", block, re.I)
        seal = re.search(r"Sealing\s+([^\n]+)", block, re.I)
        feats = []
        if capicity:
            feats.append(f"Capacity: {capicity.group(1)}")
        if max_cut:
            feats.append(f"Max cut: {max_cut.group(1)}")
        if deo:
            feats.append(f"Deodorization: {clean(deo.group(1))}")
        if base:
            feats.append(f"Baseplate: {clean(base.group(1))}")
        if seal:
            feats.append(f"Sealing: {clean(seal.group(1))}")
        bag_line = re.search(r"(Two-pi?ace|One-pi?ace)[^\n]+", block, re.I)
        bag_type = bag_line.group(0) if bag_line else "Vistoma Ostomy Product"
        name = f"Vistoma {clean(bag_type)} — {code}"
        add(code, name, name, feats, capicity.group(1) if capicity else "", pkg.group(1) if pkg else "", "Ostomy Care")

    for p in products.values():
        p["category"] = category_for_code(p["code"])

    result = sorted(products.values(), key=lambda x: (x["category"], x["code"]))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, indent=2, ensure_ascii=False))
    print(f"Parsed {len(result)} products -> {OUT}")


if __name__ == "__main__":
    main()
