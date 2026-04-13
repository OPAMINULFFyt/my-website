import { supabase } from './supabase';
import { toast } from 'sonner';

/**
 * Awards points (EXP or OPX) to a user based on a trigger key defined in settings.
 * @param userId The ID of the user to award points to
 * @param triggerKey The key defined in Admin > Reward Config (e.g. 'daily_login_exp')
 */
export async function awardPoints(userId: string, triggerKey: string) {
  try {
    // 1. Fetch the reward value from settings
    const { data: setting, error: settingError } = await supabase
      .from('settings')
      .select('*')
      .eq('key', triggerKey)
      .single();

    if (settingError || !setting) {
      console.warn(`Reward trigger '${triggerKey}' not found in settings.`);
      return;
    }

    const value = parseInt(setting.value);
    if (isNaN(value) || value <= 0) return;

    // 2. Determine type (EXP or OPX)
    const isExp = triggerKey.endsWith('_exp');
    const isOpx = triggerKey.endsWith('_opx');

    if (!isExp && !isOpx) {
      console.error(`Invalid trigger key format: ${triggerKey}. Must end in _exp or _opx.`);
      return;
    }

    // 3. Update user profile
    const updateData: any = {};
    if (isExp) {
      // Fetch current exp first to increment
      const { data: profile } = await supabase
        .from('profiles')
        .select('exp')
        .eq('id', userId)
        .single();
      
      updateData.exp = (profile?.exp || 0) + value;
    } else {
      // Fetch current opx first to increment
      const { data: profile } = await supabase
        .from('profiles')
        .select('opx_coins')
        .eq('id', userId)
        .single();
      
      updateData.opx_coins = (profile?.opx_coins || 0) + value;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (updateError) throw updateError;

    // 4. Log the action (Optional but recommended)
    await supabase.from('logs').insert({
      user_id: userId,
      action: `REWARD_AWARDED`,
      details: `Awarded ${value} ${isExp ? 'EXP' : 'OPX'} for trigger: ${triggerKey}`,
      type: 'system'
    });

    toast.success(`REWARD_UNLOCKED: +${value} ${isExp ? 'EXP' : 'OPX'}`);
    
    return true;
  } catch (err: any) {
    console.error('Failed to award points:', err);
    return false;
  }
}
