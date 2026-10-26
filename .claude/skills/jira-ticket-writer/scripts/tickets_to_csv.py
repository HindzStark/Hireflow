"""Convert a tickets JSON file into a Jira-importable CSV.

Usage: python tickets_to_csv.py <tickets.json> <out.csv>

See ../references/jira-csv.md for the input schema. Multi-value fields
(components, labels) become repeated columns with the same header, which is
how Jira's CSV importer expects multiple values. Epics are written first so
children can reference them through the Issue ID column.
"""
import csv
import json
import sys


def main(src: str, dst: str) -> None:
    with open(src, encoding="utf-8") as f:
        tickets = json.load(f)
    if not isinstance(tickets, list):
        sys.exit("tickets JSON must be a list of ticket objects")

    tickets.sort(key=lambda t: 0 if t.get("type") == "Epic" else 1)
    n_comp = max((len(t.get("components") or []) for t in tickets), default=0)
    n_lab = max((len(t.get("labels") or []) for t in tickets), default=0)

    header = ["Issue ID", "Summary", "Issue Type", "Parent", "Priority", "Story Points"]
    header += ["Component/s"] * n_comp + ["Labels"] * n_lab + ["Description"]

    with open(dst, "w", encoding="utf-8", newline="") as f:
        w = csv.writer(f, quoting=csv.QUOTE_ALL)
        w.writerow(header)
        for t in tickets:
            comps = list(t.get("components") or [])
            labels = list(t.get("labels") or [])
            points = t.get("points")
            w.writerow(
                [
                    t.get("id", ""),
                    t["summary"],
                    t.get("type", "Story"),
                    t.get("parent") or "",
                    t.get("priority", "Medium"),
                    "" if points is None else points,
                ]
                + comps + [""] * (n_comp - len(comps))
                + labels + [""] * (n_lab - len(labels))
                + [t.get("description", "")]
            )
    print(f"wrote {len(tickets)} tickets to {dst}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
