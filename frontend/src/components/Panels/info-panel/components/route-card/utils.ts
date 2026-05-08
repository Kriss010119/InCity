export function extractSectionIndexFromGapId(gapId: string): number {
  const sectionMatch = gapId.match(/^section-(\d+)$/);
  if (sectionMatch) {
    return parseInt(sectionMatch[1], 10);
  }

  if (gapId === 'walk-final-return') {
    return -1;
  }

  const match = gapId.match(/walk-to-section-(\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }

  const matchCluster = gapId.match(/walk-cluster-(\d+)-/);
  if (matchCluster) {
    return parseInt(matchCluster[1], 10);
  }

  const matchTransfer = gapId.match(/walk-transfer-(\d+)-/);
  if (matchTransfer) {
    return parseInt(matchTransfer[1], 10);
  }

  const matchTransport = gapId.match(/walk-transport-to-cluster-(\d+)/);
  if (matchTransport) {
    return parseInt(matchTransport[1], 10);
  }

  const matchWalkSection = gapId.match(/walk-section-(\d+)/);
  if (matchWalkSection) {
    return parseInt(matchWalkSection[1], 10);
  }

  const gapMatch = gapId.match(/^(\d+)-(\d+)$/);
  if (gapMatch) {
    return parseInt(gapMatch[1], 10);
  }

  return -1;
}
