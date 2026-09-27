import {beforeEach,describe,expect,it,vi} from 'vitest';

vi.mock('react-native',()=>({Platform:{OS:'ios'}}));

const getTrackingPermissionsAsync=vi.fn();
const requestTrackingPermissionsAsync=vi.fn();
const isAvailable=vi.fn(()=>true);

vi.mock('expo-tracking-transparency',()=>({
  PermissionStatus:{UNDETERMINED:'undetermined',GRANTED:'granted',DENIED:'denied'},
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
  isAvailable,
}));

describe('requestTrackingIfNeeded',()=>{
  beforeEach(()=>{
    vi.resetModules();
    getTrackingPermissionsAsync.mockReset();
    requestTrackingPermissionsAsync.mockReset();
    isAvailable.mockReset();
    isAvailable.mockReturnValue(true);
  });

  it('requests ATT when status is undetermined',async()=>{
    getTrackingPermissionsAsync.mockResolvedValue({status:'undetermined',granted:false,canAskAgain:true,expires:'never'});
    requestTrackingPermissionsAsync.mockResolvedValue({status:'granted',granted:true,canAskAgain:true,expires:'never'});
    const {requestTrackingIfNeeded}=await import('../src/services/ads/trackingPermission');
    await expect(requestTrackingIfNeeded()).resolves.toBe(true);
    expect(requestTrackingPermissionsAsync).toHaveBeenCalledOnce();
  });

  it('does not re-prompt when already decided',async()=>{
    getTrackingPermissionsAsync.mockResolvedValue({status:'denied',granted:false,canAskAgain:false,expires:'never'});
    const {requestTrackingIfNeeded}=await import('../src/services/ads/trackingPermission');
    await expect(requestTrackingIfNeeded()).resolves.toBe(false);
    expect(requestTrackingPermissionsAsync).not.toHaveBeenCalled();
  });
});
