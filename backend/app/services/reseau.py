import subprocess
import re
from ipaddress import ip_address
from icmplib import ping as icmp_ping, multiping


def ping_detaille(adresse_ip: str, count: int = 4):
    """Ping une IP et retourne un détail complet (pour le terminal de diagnostic)."""
    resultat = icmp_ping(adresse_ip, count=count, timeout=1, privileged=False)
    return {
        "adresse_ip": adresse_ip,
        "est_disponible": resultat.is_alive,
        "paquets_envoyes": resultat.packets_sent,
        "paquets_recus": resultat.packets_received,
        "perte_pourcentage": resultat.packet_loss * 100,
        "temps_min_ms": resultat.min_rtt,
        "temps_moyen_ms": resultat.avg_rtt,
        "temps_max_ms": resultat.max_rtt,
    }


def pinger_ip(adresse_ip: str) -> bool:
    """Ping une adresse IP et retourne True si elle répond."""
    if not adresse_ip:
        return False
    resultat = icmp_ping(adresse_ip, count=2, timeout=1, privileged=False)
    return resultat.is_alive

def recuperer_mac(adresse_ip: str):
    """Lit la table ARP de la machine pour récupérer l'adresse MAC d'une IP.
    Ne fonctionne que si l'équipement est sur le même sous-réseau."""
    if not adresse_ip:
        return None
    try:
        resultat = subprocess.run(
            ["arp", "-a", adresse_ip],
            capture_output=True, text=True, timeout=3
        )
        sortie = resultat.stdout
        correspondance = re.search(r"([0-9A-Fa-f]{2}[-:]){5}[0-9A-Fa-f]{2}", sortie)
        if correspondance:
            return correspondance.group(0).replace("-", ":").upper()
    except Exception:
        pass
    return None


def generer_plage_ip(ip_debut: str, ip_fin: str) -> list[str]:
    debut = int(ip_address(ip_debut))
    fin = int(ip_address(ip_fin))
    return [str(ip_address(i)) for i in range(debut, fin + 1)]


def scanner_plage(ip_debut: str, ip_fin: str):
    """Ping toutes les IP de la plage en parallèle. Retourne (adresses_actives, adresses_echec)."""
    adresses = generer_plage_ip(ip_debut, ip_fin)
    resultats = multiping(adresses, count=1, timeout=1, privileged=False, concurrent_tasks=50)
    actives = [r.address for r in resultats if r.is_alive]
    echecs = [r.address for r in resultats if not r.is_alive]
    return actives, echecs
import socket

PORTS_SIGNATURES = {
    "serveur": [80, 443, 22, 3306, 5432],
    "routeur": [23, 161, 179],
    "switch": [161, 22],
    "pc": [3389, 445, 139],
    "parefeu": [443, 500, 4500],
}


def scanner_port(ip: str, port: int, timeout=0.5) -> bool:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(timeout)
            return s.connect_ex((ip, port)) == 0
    except Exception:
        return False


def detecter_ports_ouverts(ip: str) -> list[int]:
    tous_ports = sorted({p for ports in PORTS_SIGNATURES.values() for p in ports})
    return [p for p in tous_ports if scanner_port(ip, p)]


def detecter_categorie(ip: str):
    """Retourne (categorie, niveau_confiance) en analysant les ports ouverts."""
    ports_ouverts = detecter_ports_ouverts(ip)
    if not ports_ouverts:
        return None, 0.0

    meilleure_categorie = None
    meilleur_score = 0.0
    for categorie, ports_attendus in PORTS_SIGNATURES.items():
        correspondances = len(set(ports_ouverts) & set(ports_attendus))
        if correspondances > 0:
            score = correspondances / len(ports_attendus)
            if score > meilleur_score:
                meilleur_score = score
                meilleure_categorie = categorie

    return meilleure_categorie, round(meilleur_score, 2)