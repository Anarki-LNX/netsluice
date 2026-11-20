# Deeper Connect Mini - U-Boot probe
# Writes the bootloader environment to probe-env.txt on the SD card it was loaded from.
# It writes to that card only and then lets the normal boot continue.
echo "=== deeper probe start ==="

setenv paddr
if test -n "${kernel_addr_r}"; then setenv paddr ${kernel_addr_r}; fi
if test -z "${paddr}"; then if test -n "${loadaddr}"; then setenv paddr ${loadaddr}; fi; fi

setenv pdev
if test -n "${devtype}"; then if test -n "${devnum}"; then
  if test -n "${distro_bootpart}"; then setenv pdev "${devtype} ${devnum}:${distro_bootpart}"; else setenv pdev "${devtype} ${devnum}:1"; fi
fi; fi

if test -n "${paddr}"; then
  env export -t ${paddr}
  setenv psize ${filesize}
  if test -n "${pdev}"; then
    fatwrite ${pdev} ${paddr} probe-env.txt ${psize}
  else
    fatwrite mmc 0:1 ${paddr} probe-env0.txt ${psize}
    fatwrite mmc 1:1 ${paddr} probe-env1.txt ${psize}
    fatwrite mmc 2:1 ${paddr} probe-env2.txt ${psize}
  fi
else
  echo "probe: no load address known, nothing written"
fi
echo "=== deeper probe done, normal boot continues ==="
