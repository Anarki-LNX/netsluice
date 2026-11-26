---
title: SSH access
description: SSH is off and the system account is locked. Put your public key on the card to switch SSH on, for keys only.
lang: en
section: install
order: 23
updated: 2026-11-26
---

The ready-made image has no login to the system underneath. SSH is off, the system account is locked, and the consoles log nobody in. You do not need SSH to use NetSluice. Everything is done in the interface.

If you want SSH, you give the card your public key.

## Switching SSH on

1. Write the image to the card.
2. Mount the card on a **Linux computer**. The card is ext4, so Windows and macOS cannot write to it without extra tools.
3. Copy your public key to `/boot/netsluice-ssh.pub` on the card's partition. For example, with the partition mounted at `/mnt`:

   ```bash
   sudo cp ~/.ssh/id_ed25519.pub /mnt/boot/netsluice-ssh.pub
   sudo umount /mnt
   ```

4. Start the device with the card. On that start the key becomes the key of `root`, and SSH is switched on.

Then log in with:

```bash
ssh root@netsluice.local
```

## What it accepts

- Keys of the types `ssh-ed25519`, `ssh-rsa`, `ecdsa-sha2-nistp…` and the security-key types `sk-ssh-ed25519@openssh.com` and `sk-ecdsa-sha2-nistp256@openssh.com`.
- Keys only. Password logins are switched off.
- A file that is not a public key is ignored, and SSH stays off.

## Useful once you are in

On the device the NetSluice service answers on `http://127.0.0.1:3002` and the filter engine on `http://127.0.0.1:3001`, both without a session. That is handy for testing. These ports are not reachable from the network.

The log of the first-start setup is kept in `/var/lib/netsluice-setup/setup.log`.

## If you build the system yourself

On the self-built route Armbian starts with SSH on. You log in as `root` and Armbian asks for a new password on the first login. Its default password is public, so do this right away. See [Build from source](/en/docs/build-from-source/).
