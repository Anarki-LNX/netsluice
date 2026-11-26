---
title: SSH-Zugang
description: SSH ist aus und das Systemkonto gesperrt. Mit deinem öffentlichen Schlüssel auf der Karte geht SSH an, nur mit Schlüssel.
lang: de
section: install
order: 23
updated: 2026-11-26
---

Das fertige Abbild hat keine Anmeldung am System darunter. SSH ist aus, das Systemkonto gesperrt, und an den Konsolen meldet sich niemand an. Für NetSluice brauchst du kein SSH. Alles geht über die Oberfläche.

Wenn du SSH willst, gibst du der Karte deinen öffentlichen Schlüssel.

## SSH einschalten

1. Schreib das Abbild auf die Karte.
2. Häng die Karte an einem **Linux-Rechner** ein. Die Karte ist ext4, Windows und macOS können ohne Zusatzwerkzeuge nicht darauf schreiben.
3. Kopier deinen öffentlichen Schlüssel nach `/boot/netsluice-ssh.pub` auf der Partition der Karte. Zum Beispiel, wenn die Partition unter `/mnt` eingehängt ist:

   ```bash
   sudo cp ~/.ssh/id_ed25519.pub /mnt/boot/netsluice-ssh.pub
   sudo umount /mnt
   ```

4. Starte das Gerät mit der Karte. Bei diesem Start wird der Schlüssel zum Schlüssel von `root`, und SSH geht an.

Dann meldest du dich so an:

```bash
ssh root@netsluice.local
```

## Was angenommen wird

- Schlüssel der Typen `ssh-ed25519`, `ssh-rsa`, `ecdsa-sha2-nistp…` sowie die Sicherheitsschlüssel-Typen `sk-ssh-ed25519@openssh.com` und `sk-ecdsa-sha2-nistp256@openssh.com`.
- Nur Schlüssel. Die Anmeldung mit Passwort ist abgeschaltet.
- Eine Datei, die kein öffentlicher Schlüssel ist, wird übergangen, und SSH bleibt aus.

## Nützlich, wenn du drin bist

Auf dem Gerät antwortet der NetSluice-Dienst unter `http://127.0.0.1:3002` und der Filter-Motor unter `http://127.0.0.1:3001`, beide ohne Anmeldung. Das ist praktisch zum Testen. Aus dem Netz sind diese Ports nicht erreichbar.

Das Protokoll der Einrichtung beim ersten Start liegt in `/var/lib/netsluice-setup/setup.log`.

## Wenn du das System selbst baust

Beim Selberbauen startet Armbian mit eingeschaltetem SSH. Du meldest dich als `root` an, und Armbian verlangt bei der ersten Anmeldung ein neues Passwort. Sein Standardpasswort ist öffentlich bekannt, also mach das sofort. Siehe [Selbst bauen](/de/docs/build-from-source/).
