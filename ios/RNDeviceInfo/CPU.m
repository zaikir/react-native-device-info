#import <Foundation/Foundation.h>
#include <mach/mach.h>
#import "CPU.h"

@implementation CPU

static long prev_user_ticks = 0;
static long prev_sys_ticks  = 0;
static long prev_idle_ticks = 0;
static long prev_nice_ticks = 0;

+ (double) getProcessorUsage {
    host_cpu_load_info_data_t load;
    mach_msg_type_number_t count = HOST_CPU_LOAD_INFO_COUNT;
    kern_return_t kr = host_statistics(mach_host_self(), HOST_CPU_LOAD_INFO, (host_info_t)&load, &count);
    if (kr != KERN_SUCCESS) {
        return -1;
    }
    
    double userDiff = (double)(load.cpu_ticks[0] - prev_user_ticks);
    double sysDiff  = (double)(load.cpu_ticks[1] - prev_sys_ticks);
    double idleDiff = (double)(load.cpu_ticks[2] - prev_idle_ticks);
    double niceDiff = (double)(load.cpu_ticks[3] - prev_nice_ticks);
    
    prev_user_ticks  = load.cpu_ticks[0];
    prev_sys_ticks   = load.cpu_ticks[1];
    prev_idle_ticks  = load.cpu_ticks[2];
    prev_nice_ticks  = load.cpu_ticks[3];
    
    double totalTicks = sysDiff + userDiff + niceDiff + idleDiff;
    
    double sys  = sysDiff  / totalTicks * 100.0;
    double user = userDiff / totalTicks * 100.0;
    double idle = idleDiff / totalTicks * 100.0;
    double nice = niceDiff / totalTicks * 100.0;
    
    return sys + user + nice;
}


@end
