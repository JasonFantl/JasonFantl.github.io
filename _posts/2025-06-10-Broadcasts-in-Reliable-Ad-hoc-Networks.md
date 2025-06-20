---
title: Broadcasts in Reliable Ad-hoc Networks
categories: []
img_path: https:///bloag-assets.netlify.app/gifs/broadcasts
image: cover.png
math: true
---

<!-- This is essentially a survey on single-source terminating broadcasts in reliable connected ad-hoc networks. -->

My personal interest is in swarm robotics, a field requiring the coordination of agents in a decentralized mesh-network. One of the most fundamental operations in such networks is __broadcast__: getting a message from a single source to every other node in the system

The following is a growing collection of broadcast algorithms for different reliable ad-hoc network models. I am slowly trying to fill every entry in the table of all possible network models. For each algorithm I provide an intuitive overview and pseudocode. Interestingly, even for such a simple operation, some network models are shown to be impossible to solve for. Many of the dynamic algorithms are missing from the table either because I have yet to find the algorithm in the literature, because an algorithm has yet to be discovered, or because they have yet to be proven impossible.

Before we begin, we can take a look at the final result. Below is the script to generate a table of all the environments and algorithms. I strongly recommend just running the script yourself; it colors the output for improved readability.

<details markdown=1><summary markdown="span">
Table code
</summary>

```python
#!/usr/bin/env python3
"""
Enumerate all broadcast environments and print the possible algorithms,
color-coded by termination type, and bolding if that is the algorithm's 
most general environment.
"""

import argparse
import itertools

# Define constants for special value strings
ENV_STATIC = "Static"
ENV_DYNAMIC = "Dynamic"
ID_SEQUENCE = "Sequential IDs"
ID_IDENTIFIER = "IDs"
ID_PORT = "Port IDs"
ID_ANONYMOUS = "Anonymous"
SYNC_ROUNDS = "Rounds"
SYNC_BOUNDED_ASYNCHRONOUS = "Bounded Asynchronous"
SYNC_ASYNCHRONOUS = "Asynchronous"
N_KNOWN = "Known"
N_CLOSE = "Closely bounded"
N_UNKNOWN = "Unknown"
TERM_STABILIZING = "Stabilizing"
TERM_EXPLICIT = "Explicit"
TERM_IMPOSSIBLE = "Impossible"

# Models and their generality ranks
ID_MODELS = [ID_SEQUENCE, ID_IDENTIFIER, ID_PORT, ID_ANONYMOUS]
SYNC_MODELS = [SYNC_ROUNDS, SYNC_BOUNDED_ASYNCHRONOUS, SYNC_ASYNCHRONOUS]
N_MODELS = [N_KNOWN, N_CLOSE, N_UNKNOWN]
ENV_MODELS = [ENV_STATIC, ENV_DYNAMIC]
TERM_MODELS = [TERM_STABILIZING, TERM_EXPLICIT]

# ordering the generality of the models, larger number means more general
ID_DOM = {m: i for i, m in enumerate(ID_MODELS)}
SYNC_DOM = {m: i for i, m in enumerate(SYNC_MODELS)}
N_DOM = {m: i for i, m in enumerate(N_MODELS)}
ENV_DOM = {m: i for i, m in enumerate(ENV_MODELS)}
TERM_DOM = {m: i for i, m in enumerate(TERM_MODELS)}

# ANSI color codes for terminal output
COLORS = {
    TERM_IMPOSSIBLE: "\033[91m",  # red
    TERM_EXPLICIT: "\033[92m",  # green
    TERM_STABILIZING: "\033[93m",  # yellow
    N_UNKNOWN: "\033[90m",  # grey
}
BOLD = "\033[1m"
RESET = "\033[0m"

# the algorithms
algorithms = {
    "Amnesiac Broadcast": {
        "environment": (ENV_STATIC, SYNC_ASYNCHRONOUS, ID_ANONYMOUS, N_UNKNOWN, TERM_STABILIZING),
        "complexity": ("O(1)", "O(n)"),
    },
    "Keep-alive Broadcast": {
        "environment": (ENV_STATIC, SYNC_ROUNDS, ID_ANONYMOUS, N_UNKNOWN, TERM_EXPLICIT),
        "complexity": ("O(log(n))", "O(n)"),
    },
    "Bounded Broadcast": {
        "environment": (ENV_STATIC, SYNC_ROUNDS, ID_ANONYMOUS, N_CLOSE, TERM_EXPLICIT),
        "complexity": ("O(log(n))", "O(n)"),
    },
    "Anonymous Echo Broadcast": {
        "environment": (ENV_STATIC, SYNC_BOUNDED_ASYNCHRONOUS, ID_ANONYMOUS, N_UNKNOWN, TERM_EXPLICIT),
        "complexity": ("O(log(n))", "O(n)"),
    },
    "Echo Broadcast": {
        "environment": (ENV_STATIC, SYNC_ASYNCHRONOUS, ID_PORT, N_UNKNOWN, TERM_EXPLICIT),
        "complexity": ("O(log(n))", "O(n)"),
    },
    "Countdown Broadcast": {
        "environment": (ENV_DYNAMIC, SYNC_ROUNDS, ID_ANONYMOUS, N_UNKNOWN, TERM_STABILIZING),
        "complexity": ("O(log(n))", "O(n)"),
    },
    "Counter-Flooding Broadcast": {
        "environment": (ENV_DYNAMIC, SYNC_BOUNDED_ASYNCHRONOUS, ID_ANONYMOUS, N_CLOSE, TERM_STABILIZING),
        "complexity": ("O(log(n))", "O(n)"),
    },
    "Sequential-ID Flooding Broadcast": {
        "environment": (ENV_DYNAMIC, SYNC_BOUNDED_ASYNCHRONOUS, ID_SEQUENCE, N_UNKNOWN, TERM_STABILIZING),
        "complexity": ("O(log(n))", "O(n²)"),
    },
    "List-Flooding Broadcast": {
        "environment": (ENV_DYNAMIC, SYNC_BOUNDED_ASYNCHRONOUS, ID_IDENTIFIER, N_UNKNOWN, TERM_STABILIZING),
        "complexity": ("O(n log(n))", "O(n²)"),
    },
    "ID-List Broadcast": {
        "environment": (ENV_DYNAMIC, SYNC_ASYNCHRONOUS, ID_IDENTIFIER, N_KNOWN, TERM_EXPLICIT),
        "complexity": ("O(n log(n))", "O(n²)"),
    },
    "Dynamic Bounded Broadcast": {
        "environment": (ENV_DYNAMIC, SYNC_BOUNDED_ASYNCHRONOUS, ID_ANONYMOUS, N_CLOSE, TERM_EXPLICIT),
        "complexity": ("O(log(n))", "O(n)"),
    },
}

impossible_envs = [
    (ENV_STATIC, SYNC_ASYNCHRONOUS, ID_ANONYMOUS, N_KNOWN, TERM_EXPLICIT),
    (ENV_DYNAMIC, SYNC_ROUNDS, ID_ANONYMOUS, N_UNKNOWN, TERM_EXPLICIT),
]



def is_more_general(env_a, env_b):
    """Check if environment env_a is more general than env_b."""
    return (
        ENV_DOM[env_a[0]] >= ENV_DOM[env_b[0]]
        and SYNC_DOM[env_a[1]] >= SYNC_DOM[env_b[1]]
        and ID_DOM[env_a[2]] >= ID_DOM[env_b[2]]
        and N_DOM[env_a[3]] >= N_DOM[env_b[3]]
        and TERM_DOM[env_a[4]] >= TERM_DOM[env_b[4]]
    )


def is_less_general(env_a, env_b):
    """Check if environment env_a is less general than env_b."""
    return (
        ENV_DOM[env_a[0]] <= ENV_DOM[env_b[0]]
        and SYNC_DOM[env_a[1]] <= SYNC_DOM[env_b[1]]
        and ID_DOM[env_a[2]] <= ID_DOM[env_b[2]]
        and N_DOM[env_a[3]] <= N_DOM[env_b[3]]
        and TERM_DOM[env_a[4]] <= TERM_DOM[env_b[4]]
    )

def propagate_seeds(full_env_results):
    """Propagate seed algorithms to less general environments."""

    # propogate the impossible proofs to more general environments
    for impossible_env in impossible_envs:
        for table_entry_env in full_env_results.keys():
            if is_more_general(table_entry_env, impossible_env):
                full_env_results[table_entry_env].append(TERM_IMPOSSIBLE)
    
    # propogate the algorithms to less general environments
    for algo_name, algo_data in algorithms.items():
        for table_entry_env in full_env_results.keys():
            if is_less_general(table_entry_env, algo_data["environment"]):
                full_env_results[table_entry_env].append(algo_name)

def print_table(environment_table, collapse_flag):
    """Print the broadcast table."""
    header = f"{'Movement':>15} | {'Sync Model':>20} | {'Identification':>15} | {'Knowledge of N':>15} | {'Termination':>15} | Algorithms"
    print(header)
    print("|".join(["-" * len(column) for column in header.split("|")]))

    sorted_environments = sorted(
        environment_table.keys(),
        key=lambda e: (ENV_DOM[e[0]], SYNC_DOM[e[1]], ID_DOM[e[2]], N_DOM[e[3]], TERM_DOM[e[4]]),
    )

    for table_env in sorted_environments:
        table_row_move_model, table_row_sync_model, table_row_id_model, table_row_n_info, table_row_termination_type = table_env
        
        algo_names = environment_table[table_env]
        algo_strings = []
        for algo_name in algo_names:
            if algo_name == TERM_IMPOSSIBLE:
                algo_string = COLORS[TERM_IMPOSSIBLE] + TERM_IMPOSSIBLE
                if table_env in impossible_envs:
                    algo_string = BOLD + algo_string
                    
                algo_strings.append(algo_string + RESET)
                break

            algo_complexity = algorithms[algo_name]["complexity"]
            algo_environment = algorithms[algo_name]["environment"]
            algo_string = f"{algo_name} ({algo_complexity[0]}, {algo_complexity[1]})"
            algo_string = COLORS[algo_environment[-1]] +  algo_string
            if algo_environment == table_env:
                algo_string = BOLD + algo_string
            
            algo_strings.append(algo_string + RESET)
            
        algos_string = " / ".join(algo_strings)

        if collapse_flag:
            # skip rows with more then one entry in them or have one entry that is inherited from a more general environment
            if len(algo_names) > 1:
                continue
            if len(algo_names) == 1:
                if algo_names[0] == TERM_IMPOSSIBLE and table_env not in impossible_envs:
                    continue
                if algo_names[0] != TERM_IMPOSSIBLE and algorithms[algo_names[0]]["environment"] != table_env:
                    continue

        print(f"{table_row_move_model:>15} | {table_row_sync_model:>20} | {table_row_id_model:>15} | {table_row_n_info:>15} | {table_row_termination_type:>15} | {algos_string}")


def main():
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description="Print broadcast table.")
    parser.add_argument("--collapse", action="store_true", help="Collapse the table to show only seed rows or rows with no algorithm.")
    args = parser.parse_args()

    # Initialize all environments
    full_env_results = { 
        env: [] for env in itertools.product(ENV_MODELS, SYNC_MODELS, ID_MODELS, N_MODELS, TERM_MODELS)}

    # Propagate seeds
    propagate_seeds(full_env_results)

    # Print the table
    print_table(full_env_results, args.collapse)


if __name__ == "__main__":
    main()
```

</details>

The collapsed table only shows the most general algorithms, ignoring all the more specific environments covered by the more general solutions. The expanded table shows every possible environment and all the algorithms available for that environment.

Here are the tables. Just a few algorithms are enough to cover the entire static environment, while there are many empty entries left in the dynamic section.

<details markdown=1><summary markdown="span">
Collapsed table.
</summary>

| Movement | Sync Model           | Identification | Knowledge of N  | Termination | Algorithms                                   |
| -------- | -------------------- | -------------- | --------------- | ----------- | -------------------------------------------- |
| Static   | Bounded Asynchronous | Anonymous      | Unknown         | Explicit    | Anonymous Echo Broadcast (O(log(n)), O(n))   |
| Static   | Asynchronous         | Port IDs       | Unknown         | Explicit    | Echo Broadcast (O(log(n)), O(n))             |
| Static   | Asynchronous         | Anonymous      | Known           | Explicit    | Impossible                                   |
| Static   | Asynchronous         | Anonymous      | Unknown         | Stabilizing | Amnesiac Broadcast (O(1), O(n))              |
| Dynamic  | Rounds               | Sequential IDs | Unknown         | Explicit    |
| Dynamic  | Rounds               | IDs            | Unknown         | Explicit    |
| Dynamic  | Rounds               | Port IDs       | Unknown         | Explicit    |
| Dynamic  | Rounds               | Anonymous      | Unknown         | Stabilizing | Countdown Broadcast (O(log(n)), O(n))        |
| Dynamic  | Rounds               | Anonymous      | Unknown         | Explicit    | Impossible                                   |
| Dynamic  | Bounded Asynchronous | Sequential IDs | Unknown         | Explicit    |
| Dynamic  | Bounded Asynchronous | IDs            | Unknown         | Stabilizing | List-Flooding Broadcast (O(n log(n)), O(n²)) |
| Dynamic  | Bounded Asynchronous | IDs            | Unknown         | Explicit    |
| Dynamic  | Bounded Asynchronous | Port IDs       | Unknown         | Stabilizing |
| Dynamic  | Bounded Asynchronous | Port IDs       | Unknown         | Explicit    |
| Dynamic  | Bounded Asynchronous | Anonymous      | Closely bounded | Explicit    | Dynamic Bounded Broadcast (O(log(n)), O(n))  |
| Dynamic  | Bounded Asynchronous | Anonymous      | Unknown         | Stabilizing |
| Dynamic  | Asynchronous         | Sequential IDs | Closely bounded | Stabilizing |
| Dynamic  | Asynchronous         | Sequential IDs | Closely bounded | Explicit    |
| Dynamic  | Asynchronous         | Sequential IDs | Unknown         | Stabilizing |
| Dynamic  | Asynchronous         | Sequential IDs | Unknown         | Explicit    |
| Dynamic  | Asynchronous         | IDs            | Known           | Explicit    | ID-List Broadcast (O(n log(n)), O(n²))       |
| Dynamic  | Asynchronous         | IDs            | Closely bounded | Stabilizing |
| Dynamic  | Asynchronous         | IDs            | Closely bounded | Explicit    |
| Dynamic  | Asynchronous         | IDs            | Unknown         | Stabilizing |
| Dynamic  | Asynchronous         | IDs            | Unknown         | Explicit    |
| Dynamic  | Asynchronous         | Port IDs       | Known           | Stabilizing |
| Dynamic  | Asynchronous         | Port IDs       | Known           | Explicit    |
| Dynamic  | Asynchronous         | Port IDs       | Closely bounded | Stabilizing |
| Dynamic  | Asynchronous         | Port IDs       | Closely bounded | Explicit    |
| Dynamic  | Asynchronous         | Port IDs       | Unknown         | Stabilizing |
| Dynamic  | Asynchronous         | Port IDs       | Unknown         | Explicit    |
| Dynamic  | Asynchronous         | Anonymous      | Known           | Stabilizing |
| Dynamic  | Asynchronous         | Anonymous      | Closely bounded | Stabilizing |
| Dynamic  | Asynchronous         | Anonymous      | Unknown         | Stabilizing |

</details>

<details markdown=1><summary markdown="span">
Expanded table.
</summary>

| Movement | Sync Model           | Identification | Knowledge of N  | Termination | Algorithms                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------- | -------------------- | -------------- | --------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Static   | Rounds               | Sequential IDs | Known           | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Keep-alive Broadcast (O(log(n)), O(n)) / Bounded Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Countdown Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / Sequential-ID Flooding Broadcast (O(log(n)), O(n²)) / List-Flooding Broadcast (O(n log(n)), O(n²)) / ID-List Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n)) |
| Static   | Rounds               | Sequential IDs | Known           | Explicit    | Keep-alive Broadcast (O(log(n)), O(n)) / Bounded Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / ID-List Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                               |
| Static   | Rounds               | Sequential IDs | Closely bounded | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Keep-alive Broadcast (O(log(n)), O(n)) / Bounded Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Countdown Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / Sequential-ID Flooding Broadcast (O(log(n)), O(n²)) / List-Flooding Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                          |
| Static   | Rounds               | Sequential IDs | Closely bounded | Explicit    | Keep-alive Broadcast (O(log(n)), O(n)) / Bounded Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                        |
| Static   | Rounds               | Sequential IDs | Unknown         | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Keep-alive Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Countdown Broadcast (O(log(n)), O(n)) / Sequential-ID Flooding Broadcast (O(log(n)), O(n²)) / List-Flooding Broadcast (O(n log(n)), O(n²))                                                                                                                                                                             |
| Static   | Rounds               | Sequential IDs | Unknown         | Explicit    | Keep-alive Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                            |
| Static   | Rounds               | IDs            | Known           | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Keep-alive Broadcast (O(log(n)), O(n)) / Bounded Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Countdown Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / List-Flooding Broadcast (O(n log(n)), O(n²)) / ID-List Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                       |
| Static   | Rounds               | IDs            | Known           | Explicit    | Keep-alive Broadcast (O(log(n)), O(n)) / Bounded Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / ID-List Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                               |
| Static   | Rounds               | IDs            | Closely bounded | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Keep-alive Broadcast (O(log(n)), O(n)) / Bounded Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Countdown Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / List-Flooding Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                |
| Static   | Rounds               | IDs            | Closely bounded | Explicit    | Keep-alive Broadcast (O(log(n)), O(n)) / Bounded Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                        |
| Static   | Rounds               | IDs            | Unknown         | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Keep-alive Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Countdown Broadcast (O(log(n)), O(n)) / List-Flooding Broadcast (O(n log(n)), O(n²))                                                                                                                                                                                                                                   |
| Static   | Rounds               | IDs            | Unknown         | Explicit    | Keep-alive Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                            |
| Static   | Rounds               | Port IDs       | Known           | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Keep-alive Broadcast (O(log(n)), O(n)) / Bounded Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Countdown Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                               |
| Static   | Rounds               | Port IDs       | Known           | Explicit    | Keep-alive Broadcast (O(log(n)), O(n)) / Bounded Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                        |
| Static   | Rounds               | Port IDs       | Closely bounded | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Keep-alive Broadcast (O(log(n)), O(n)) / Bounded Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Countdown Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                               |
| Static   | Rounds               | Port IDs       | Closely bounded | Explicit    | Keep-alive Broadcast (O(log(n)), O(n)) / Bounded Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                        |
| Static   | Rounds               | Port IDs       | Unknown         | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Keep-alive Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Countdown Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                  |
| Static   | Rounds               | Port IDs       | Unknown         | Explicit    | Keep-alive Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                            |
| Static   | Rounds               | Anonymous      | Known           | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Keep-alive Broadcast (O(log(n)), O(n)) / Bounded Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Countdown Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                  |
| Static   | Rounds               | Anonymous      | Known           | Explicit    | Keep-alive Broadcast (O(log(n)), O(n)) / Bounded Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                           |
| Static   | Rounds               | Anonymous      | Closely bounded | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Keep-alive Broadcast (O(log(n)), O(n)) / Bounded Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Countdown Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                  |
| Static   | Rounds               | Anonymous      | Closely bounded | Explicit    | Keep-alive Broadcast (O(log(n)), O(n)) / Bounded Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                           |
| Static   | Rounds               | Anonymous      | Unknown         | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Keep-alive Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Countdown Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                     |
| Static   | Rounds               | Anonymous      | Unknown         | Explicit    | Keep-alive Broadcast (O(log(n)), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                               |
| Static   | Bounded Asynchronous | Sequential IDs | Known           | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / Sequential-ID Flooding Broadcast (O(log(n)), O(n²)) / List-Flooding Broadcast (O(n log(n)), O(n²)) / ID-List Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                        |
| Static   | Bounded Asynchronous | Sequential IDs | Known           | Explicit    | Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / ID-List Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                              |
| Static   | Bounded Asynchronous | Sequential IDs | Closely bounded | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / Sequential-ID Flooding Broadcast (O(log(n)), O(n²)) / List-Flooding Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                 |
| Static   | Bounded Asynchronous | Sequential IDs | Closely bounded | Explicit    | Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                       |
| Static   | Bounded Asynchronous | Sequential IDs | Unknown         | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Sequential-ID Flooding Broadcast (O(log(n)), O(n²)) / List-Flooding Broadcast (O(n log(n)), O(n²))                                                                                                                                                                                                                                                              |
| Static   | Bounded Asynchronous | Sequential IDs | Unknown         | Explicit    | Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                     |
| Static   | Bounded Asynchronous | IDs            | Known           | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / List-Flooding Broadcast (O(n log(n)), O(n²)) / ID-List Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                              |
| Static   | Bounded Asynchronous | IDs            | Known           | Explicit    | Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / ID-List Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                              |
| Static   | Bounded Asynchronous | IDs            | Closely bounded | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / List-Flooding Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                       |
| Static   | Bounded Asynchronous | IDs            | Closely bounded | Explicit    | Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                       |
| Static   | Bounded Asynchronous | IDs            | Unknown         | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / List-Flooding Broadcast (O(n log(n)), O(n²))                                                                                                                                                                                                                                                                                                                    |
| Static   | Bounded Asynchronous | IDs            | Unknown         | Explicit    | Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                     |
| Static   | Bounded Asynchronous | Port IDs       | Known           | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                      |
| Static   | Bounded Asynchronous | Port IDs       | Known           | Explicit    | Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                       |
| Static   | Bounded Asynchronous | Port IDs       | Closely bounded | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                      |
| Static   | Bounded Asynchronous | Port IDs       | Closely bounded | Explicit    | Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                       |
| Static   | Bounded Asynchronous | Port IDs       | Unknown         | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                   |
| Static   | Bounded Asynchronous | Port IDs       | Unknown         | Explicit    | Anonymous Echo Broadcast (O(log(n)), O(n)) / Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                     |
| Static   | Bounded Asynchronous | Anonymous      | Known           | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                         |
| Static   | Bounded Asynchronous | Anonymous      | Known           | Explicit    | Anonymous Echo Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                          |
| Static   | Bounded Asynchronous | Anonymous      | Closely bounded | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                         |
| Static   | Bounded Asynchronous | Anonymous      | Closely bounded | Explicit    | Anonymous Echo Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                          |
| Static   | Bounded Asynchronous | Anonymous      | Unknown         | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Anonymous Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                      |
| Static   | Bounded Asynchronous | Anonymous      | Unknown         | Explicit    | Anonymous Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Static   | Asynchronous         | Sequential IDs | Known           | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Echo Broadcast (O(log(n)), O(n)) / ID-List Broadcast (O(n log(n)), O(n²))                                                                                                                                                                                                                                                                                                                                                                       |
| Static   | Asynchronous         | Sequential IDs | Known           | Explicit    | Echo Broadcast (O(log(n)), O(n)) / ID-List Broadcast (O(n log(n)), O(n²))                                                                                                                                                                                                                                                                                                                                                                                                         |
| Static   | Asynchronous         | Sequential IDs | Closely bounded | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                |
| Static   | Asynchronous         | Sequential IDs | Closely bounded | Explicit    | Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Static   | Asynchronous         | Sequential IDs | Unknown         | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                |
| Static   | Asynchronous         | Sequential IDs | Unknown         | Explicit    | Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Static   | Asynchronous         | IDs            | Known           | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Echo Broadcast (O(log(n)), O(n)) / ID-List Broadcast (O(n log(n)), O(n²))                                                                                                                                                                                                                                                                                                                                                                       |
| Static   | Asynchronous         | IDs            | Known           | Explicit    | Echo Broadcast (O(log(n)), O(n)) / ID-List Broadcast (O(n log(n)), O(n²))                                                                                                                                                                                                                                                                                                                                                                                                         |
| Static   | Asynchronous         | IDs            | Closely bounded | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                |
| Static   | Asynchronous         | IDs            | Closely bounded | Explicit    | Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Static   | Asynchronous         | IDs            | Unknown         | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                |
| Static   | Asynchronous         | IDs            | Unknown         | Explicit    | Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Static   | Asynchronous         | Port IDs       | Known           | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                |
| Static   | Asynchronous         | Port IDs       | Known           | Explicit    | Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Static   | Asynchronous         | Port IDs       | Closely bounded | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                |
| Static   | Asynchronous         | Port IDs       | Closely bounded | Explicit    | Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Static   | Asynchronous         | Port IDs       | Unknown         | Stabilizing | Amnesiac Broadcast (O(1), O(n)) / Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                |
| Static   | Asynchronous         | Port IDs       | Unknown         | Explicit    | Echo Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Static   | Asynchronous         | Anonymous      | Known           | Stabilizing | Amnesiac Broadcast (O(1), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Static   | Asynchronous         | Anonymous      | Known           | Explicit    | Impossible                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Static   | Asynchronous         | Anonymous      | Closely bounded | Stabilizing | Amnesiac Broadcast (O(1), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Static   | Asynchronous         | Anonymous      | Closely bounded | Explicit    | Impossible                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Static   | Asynchronous         | Anonymous      | Unknown         | Stabilizing | Amnesiac Broadcast (O(1), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Static   | Asynchronous         | Anonymous      | Unknown         | Explicit    | Impossible                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Dynamic  | Rounds               | Sequential IDs | Known           | Stabilizing | Countdown Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / Sequential-ID Flooding Broadcast (O(log(n)), O(n²)) / List-Flooding Broadcast (O(n log(n)), O(n²)) / ID-List Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                  |
| Dynamic  | Rounds               | Sequential IDs | Known           | Explicit    | ID-List Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                              |
| Dynamic  | Rounds               | Sequential IDs | Closely bounded | Stabilizing | Countdown Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / Sequential-ID Flooding Broadcast (O(log(n)), O(n²)) / List-Flooding Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                           |
| Dynamic  | Rounds               | Sequential IDs | Closely bounded | Explicit    | Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Dynamic  | Rounds               | Sequential IDs | Unknown         | Stabilizing | Countdown Broadcast (O(log(n)), O(n)) / Sequential-ID Flooding Broadcast (O(log(n)), O(n²)) / List-Flooding Broadcast (O(n log(n)), O(n²))                                                                                                                                                                                                                                                                                                                                        |
| Dynamic  | Rounds               | Sequential IDs | Unknown         | Explicit    |
| Dynamic  | Rounds               | IDs            | Known           | Stabilizing | Countdown Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / List-Flooding Broadcast (O(n log(n)), O(n²)) / ID-List Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                        |
| Dynamic  | Rounds               | IDs            | Known           | Explicit    | ID-List Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                              |
| Dynamic  | Rounds               | IDs            | Closely bounded | Stabilizing | Countdown Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / List-Flooding Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                 |
| Dynamic  | Rounds               | IDs            | Closely bounded | Explicit    | Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Dynamic  | Rounds               | IDs            | Unknown         | Stabilizing | Countdown Broadcast (O(log(n)), O(n)) / List-Flooding Broadcast (O(n log(n)), O(n²))                                                                                                                                                                                                                                                                                                                                                                                              |
| Dynamic  | Rounds               | IDs            | Unknown         | Explicit    |
| Dynamic  | Rounds               | Port IDs       | Known           | Stabilizing | Countdown Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                |
| Dynamic  | Rounds               | Port IDs       | Known           | Explicit    | Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Dynamic  | Rounds               | Port IDs       | Closely bounded | Stabilizing | Countdown Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                |
| Dynamic  | Rounds               | Port IDs       | Closely bounded | Explicit    | Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Dynamic  | Rounds               | Port IDs       | Unknown         | Stabilizing | Countdown Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Dynamic  | Rounds               | Port IDs       | Unknown         | Explicit    |
| Dynamic  | Rounds               | Anonymous      | Known           | Stabilizing | Countdown Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                |
| Dynamic  | Rounds               | Anonymous      | Known           | Explicit    | Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Dynamic  | Rounds               | Anonymous      | Closely bounded | Stabilizing | Countdown Broadcast (O(log(n)), O(n)) / Counter-Flooding Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                |
| Dynamic  | Rounds               | Anonymous      | Closely bounded | Explicit    | Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Dynamic  | Rounds               | Anonymous      | Unknown         | Stabilizing | Countdown Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Dynamic  | Rounds               | Anonymous      | Unknown         | Explicit    | Impossible                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Dynamic  | Bounded Asynchronous | Sequential IDs | Known           | Stabilizing | Counter-Flooding Broadcast (O(log(n)), O(n)) / Sequential-ID Flooding Broadcast (O(log(n)), O(n²)) / List-Flooding Broadcast (O(n log(n)), O(n²)) / ID-List Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                          |
| Dynamic  | Bounded Asynchronous | Sequential IDs | Known           | Explicit    | ID-List Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                              |
| Dynamic  | Bounded Asynchronous | Sequential IDs | Closely bounded | Stabilizing | Counter-Flooding Broadcast (O(log(n)), O(n)) / Sequential-ID Flooding Broadcast (O(log(n)), O(n²)) / List-Flooding Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                   |
| Dynamic  | Bounded Asynchronous | Sequential IDs | Closely bounded | Explicit    | Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Dynamic  | Bounded Asynchronous | Sequential IDs | Unknown         | Stabilizing | Sequential-ID Flooding Broadcast (O(log(n)), O(n²)) / List-Flooding Broadcast (O(n log(n)), O(n²))                                                                                                                                                                                                                                                                                                                                                                                |
| Dynamic  | Bounded Asynchronous | Sequential IDs | Unknown         | Explicit    |
| Dynamic  | Bounded Asynchronous | IDs            | Known           | Stabilizing | Counter-Flooding Broadcast (O(log(n)), O(n)) / List-Flooding Broadcast (O(n log(n)), O(n²)) / ID-List Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                |
| Dynamic  | Bounded Asynchronous | IDs            | Known           | Explicit    | ID-List Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                              |
| Dynamic  | Bounded Asynchronous | IDs            | Closely bounded | Stabilizing | Counter-Flooding Broadcast (O(log(n)), O(n)) / List-Flooding Broadcast (O(n log(n)), O(n²)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                         |
| Dynamic  | Bounded Asynchronous | IDs            | Closely bounded | Explicit    | Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Dynamic  | Bounded Asynchronous | IDs            | Unknown         | Stabilizing | List-Flooding Broadcast (O(n log(n)), O(n²))                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Dynamic  | Bounded Asynchronous | IDs            | Unknown         | Explicit    |
| Dynamic  | Bounded Asynchronous | Port IDs       | Known           | Stabilizing | Counter-Flooding Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                        |
| Dynamic  | Bounded Asynchronous | Port IDs       | Known           | Explicit    | Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Dynamic  | Bounded Asynchronous | Port IDs       | Closely bounded | Stabilizing | Counter-Flooding Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                        |
| Dynamic  | Bounded Asynchronous | Port IDs       | Closely bounded | Explicit    | Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Dynamic  | Bounded Asynchronous | Port IDs       | Unknown         | Stabilizing |
| Dynamic  | Bounded Asynchronous | Port IDs       | Unknown         | Explicit    |
| Dynamic  | Bounded Asynchronous | Anonymous      | Known           | Stabilizing | Counter-Flooding Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                        |
| Dynamic  | Bounded Asynchronous | Anonymous      | Known           | Explicit    | Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Dynamic  | Bounded Asynchronous | Anonymous      | Closely bounded | Stabilizing | Counter-Flooding Broadcast (O(log(n)), O(n)) / Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                        |
| Dynamic  | Bounded Asynchronous | Anonymous      | Closely bounded | Explicit    | Dynamic Bounded Broadcast (O(log(n)), O(n))                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Dynamic  | Bounded Asynchronous | Anonymous      | Unknown         | Stabilizing |
| Dynamic  | Bounded Asynchronous | Anonymous      | Unknown         | Explicit    | Impossible                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Dynamic  | Asynchronous         | Sequential IDs | Known           | Stabilizing | ID-List Broadcast (O(n log(n)), O(n²))                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Dynamic  | Asynchronous         | Sequential IDs | Known           | Explicit    | ID-List Broadcast (O(n log(n)), O(n²))                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Dynamic  | Asynchronous         | Sequential IDs | Closely bounded | Stabilizing |
| Dynamic  | Asynchronous         | Sequential IDs | Closely bounded | Explicit    |
| Dynamic  | Asynchronous         | Sequential IDs | Unknown         | Stabilizing |
| Dynamic  | Asynchronous         | Sequential IDs | Unknown         | Explicit    |
| Dynamic  | Asynchronous         | IDs            | Known           | Stabilizing | ID-List Broadcast (O(n log(n)), O(n²))                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Dynamic  | Asynchronous         | IDs            | Known           | Explicit    | ID-List Broadcast (O(n log(n)), O(n²))                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Dynamic  | Asynchronous         | IDs            | Closely bounded | Stabilizing |
| Dynamic  | Asynchronous         | IDs            | Closely bounded | Explicit    |
| Dynamic  | Asynchronous         | IDs            | Unknown         | Stabilizing |
| Dynamic  | Asynchronous         | IDs            | Unknown         | Explicit    |
| Dynamic  | Asynchronous         | Port IDs       | Known           | Stabilizing |
| Dynamic  | Asynchronous         | Port IDs       | Known           | Explicit    |
| Dynamic  | Asynchronous         | Port IDs       | Closely bounded | Stabilizing |
| Dynamic  | Asynchronous         | Port IDs       | Closely bounded | Explicit    |
| Dynamic  | Asynchronous         | Port IDs       | Unknown         | Stabilizing |
| Dynamic  | Asynchronous         | Port IDs       | Unknown         | Explicit    |
| Dynamic  | Asynchronous         | Anonymous      | Known           | Stabilizing |
| Dynamic  | Asynchronous         | Anonymous      | Known           | Explicit    | Impossible                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Dynamic  | Asynchronous         | Anonymous      | Closely bounded | Stabilizing |
| Dynamic  | Asynchronous         | Anonymous      | Closely bounded | Explicit    | Impossible                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Dynamic  | Asynchronous         | Anonymous      | Unknown         | Stabilizing |
| Dynamic  | Asynchronous         | Anonymous      | Unknown         | Explicit    | Impossible                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

</details>


# Terminating Broadcasts

Broadcasts are one of the easiest operations in networking, requiring one node to send a message to everyone else. This often looks like a simple flood-fill, where when a node receives the message, they pass it on to their neighbors, and eventually everyone gets the message. But there are hidden issues, like how do we know when the broadcast has terminated, can we be certain that it will terminate, and can we even be certain that everyone will receive the message?

We will explore different network models along a few different dimensions, which we see below. 

We will be looking at static and dynamic networks. 
* __Static__ networks do not change in time. Links are static.
* __Dynamic__ networks change over time. Links may be added or removed over time. How _exactly_ these links can change in time will be explored further in the section on dynamic networks.

We will also be looking at round-based and asynchronous communication models. 
* __Round-based__ means that messages get sent from one node to another between discrete rounds. For example, if a node sends a message in round $k$, then it will be received in the beginning of round $k+1$. 
* __Bounded Asynchronous__ means that a message can be sent at any point in time (not necessarily discrete) and it takes a bounded amount of time (we will call the bound $t_{upper}$) to get from one node to another.
* __Asynchronous__ means that a message can be sent at any point in time and it can take an arbitrarily long amount of time to get from one node to another. As you might imagine, this is a very difficult model to work with.

We will also be looking at networks where nodes have IDs and where they are anonymous. 
* __Sequential IDs__ means that nodes are counted off from $0$ to $n-1$, and they can all see their neighbors' IDs.
* __IDs__ means that nodes have unique IDs, not necessarily ordered, and that everyone can see their neighbors' IDs.
* __Port IDs__ means that nodes do not have IDs, but they can uniquely identify their neighbors. The idea is that each node can talk to a neighbor on a different local network port.
* __Anonymous__ means that nodes do not have IDs and cannot identify their neighbors, or even identify if they have neighbors at all. 

We will also be looking at networks of size $n$, where nodes have different amounts of information about $n$. 
* __Known n__ means that nodes know how many nodes are in the network. 
* __Close upper bound of n__ means that nodes know a close upper bound of n.
* __Unknown n__ means that nodes have no idea how many nodes are in the network.

And then the resulting algorithms under these different assumptions may or may not be correct or terminate.
* __Correct__ means every node in a network will eventually hear the broadcast. We will only consider algorithms that are correct.
* __Termination__ means Broadcasts will finish at some point in time. There are two types of termination.
  * __Stabilizing__ means the broadcast will terminate at some point in time, but none of the nodes will be able to tell when, even after the broadcast has terminated. This is useful if we only need to guarantee that information gets propagated in a network, but we don't need to know if the broadcast has terminated. Note that this is stronger than a Correct broadcast, as it requires that each node stops running the broadcast algorithm at some point, while Correct only requires that everyone hears the broadcast, which means it's possible a Correct algorithm never terminates.
  * __Explicit__ means the broadcast will terminate at some point in time, and the nodes will be able to detect that the termination has finished. This doesn't guarantee that the nodes know exactly when the broadcast terminates, but it does guarantee that the nodes will eventually know that it has terminated. This is far more preferable to a Stabilizing termination since with an Explicit termination we can use a broadcast in a larger algorithm that relies on knowing that the broadcast has finished. Often an algorithm will only allow the leader to know when a broadcast has terminated, but then the leader can use a Stabilizing broadcast to inform the rest of the network that the first broadcast is complete.

We will also take a look at the time and memory complexity of these algorithms, as there is extensive theoretical work on lower bounds for different environments. Note that the time complexity of an algorithm for an asynchronous network doesn't make much sense since a message can take an arbitrarily long amount of time. So, when we state the time complexity for asynchronous environments, we will assume the communication time is a constant.

So now we can dive into the algorithms. We start with the simpler static networks and explore all the possible algorithms for each environment.

## Static network

We will attempt to find the most general algorithm for each environment, but that sometimes means working through less general versions to see where and how these algorithms fail.

We will start with the most general static environment and see that we can only design a broadcast that has stabilizing termination, and later see that the far more desirable explicit termination is impossible.

### Amnesiac Broadcast

__Overview__: The leader announces the broadcast message, anyone who hears it sets their state to "heard" and announces to their neighbors while ignoring any future messages.

| Movement | Sync Model   | Identification | Knowledge of N | Termination | Algorithm (Space, Time)         |
| -------- | ------------ | -------------- | -------------- | ----------- | ------------------------------- |
| Static   | Asynchronous | Anonymous      | Unknown        | Stabilizing | Amnesiac Broadcast (O(1), O(n)) |


<details markdown=1><summary markdown="span">
Pseudo-code
</summary>

``` python
heard = False

def leader_init(message):
    heard = True
    announce(message)

def on_receive_announcement(message):
    if not heard:
        heard = True
        announce(message)
```

</details>

While this guarantees everyone will hear the broadcast and the broadcast terminates, the leader doesn't know when the broadcast has terminated. An explicitly terminating broadcast is impossible under these assumptions (we will soon see why), but if we loosen some assumptions, then there are a few different solutions. 

For our first explicitly terminating broadcast algorithm, we will look at a static anonymous round-based communication model where the leader knows a close upper bound on the number of nodes n. This is a highly restrictive environment, but we will build on the algorithm to work towards more general environments.

### Bounded Broadcast

__Overview__: Let us call the close upper bound of $n$ to be $n_{upper}$. The leader announces the broadcast message, anyone who hears it will set their state to "heard" and announce to their neighbors while ignoring any future messages. Eventually everyone will hear the message within n rounds, so after $n_{upper}$ rounds, each node will have stopped broadcasting and the leader can be certain the broadcast has terminated.

| Movement | Sync Model | Identification | Knowledge of N  | Termination | Algorithm (Space, Time)             |
| -------- | ---------- | -------------- | --------------- | ----------- | ----------------------------------- |
| Static   | Rounds     | Anonymous      | Closely bounded | Explicit    | Bounded Broadcast (O(log(n)), O(n)) |


<details markdown=1><summary markdown="span">
Pseudo-code
</summary>

``` python
heard = False
current_round = 0

def leader_init(message):
    heard = True
    announce(message)

def every_round():
    current_round += 1
    if leader:
        if current_round >= n_upper:
            terminated = True
    else: # non-leader
        for message in received_announcements:
            if not heard:
                heard = True
                announce(message)
```

</details>

We can make a more general version of this algorithm where we don't need to know the upper bound of n.

### Keep-alive Broadcast

__Overview__: The leader flood-fills an init message with an attached hop-count flag, which allows each node to know how far it is from the leader. When a node hears the init message for the first time, they announce it with a hop-counter, and announce to their parent (node closer to the leader) a keep-alive message. When a node hears a keep-alive message, they announce it to their parents. This causes the leader to get a stream of keep-alive messages (every other round) while the broadcast is still propagating. Once the leader stops hearing the keep-alive messages, they know the broadcast has terminated.

| Movement | Sync Model | Identification | Knowledge of N | Termination | Algorithm (Space, Time)                |
| -------- | ---------- | -------------- | -------------- | ----------- | -------------------------------------- |
| Static   | Rounds     | Anonymous      | Unknown        | Explicit    | Keep-alive Broadcast (O(log(n)), O(n)) |


<details markdown=1><summary markdown="span">
Pseudo-code
</summary>

``` python
current_round = 0
heard = False
hop_count = None
last_heard_keep_alive = 0

def leader_init(message):
    heard = True
    hop_count = 0
    payload = (MESSAGE, hop_count, message)
    announce(payload)

def every_round():
    current_round += 1
    for payload_type, sender_hop_count, message in received_announcements:
        if payload_type == MESSAGE and not heard:
            heard = True
            hop_count = sender_hop_count + 1
            payload = (MESSAGE, hop_count, message)
            announce(payload)
        elif payload_type == KEEP_ALIVE and sender_hop_count < hop_count:
            if leader:
                last_heard_keep_alive = current_round
            else:
                payload = (KEEP_ALIVE, hop_count, None)
                announce(payload)

    if leader and current_round > last_heard_keep_alive + 2:
        terminated = True
```

</details>

This is good, but sometimes we want a node to complete some task after receiving the broadcast, which means each node might need to wait some arbitrary number of rounds before terminating the broadcast. This is a subset of the [Distributed Termination Problem](https://www.sciencedirect.com/science/article/abs/pii/S0164121298100341). You might see that we can easily account for this arbitrary delay from nodes by having them continue to announce keep-alive messages while they are still running their task.

A different approach that accomplishes the same thing using less power (doesn't require as many announcements) can be seen below.

### Anonymous Echo Broadcast

__Overview__: The leader flood-fills an init message with an attached hop-count flag, which allows each node to know how far it is from the leader. This also allows nodes to count how many children (nodes farther from the leader) they are neighbors to by listening over the next two rounds for messages being announced. When a node has completed its task and has heard an echo from all of its children (or has no children), it announces an echo to its parent. This means that once the leader hears an echo from all of its children, the leader knows all the nodes in the network have heard the broadcast and completed their tasks.


| Movement | Sync Model | Identification | Knowledge of N | Termination | Algorithm (Space, Time)                    |
| -------- | ---------- | -------------- | -------------- | ----------- | ------------------------------------------ |
| Static   | Rounds     | Anonymous      | Unknown        | Explicit    | Anonymous Echo Broadcast (O(log(n)), O(n)) |


<details markdown=1><summary markdown="span">
Pseudo-code
</summary>

``` python
current_round = 0
heard = False
hop_count = None
children_count = 0
echoes_received = 0
finish_discovery_round = None

def leader_init(message):
    heard = True
    hop_count = 0
    # Optional: Start a task here
    finish_discovery_round = current_round + 2
    payload = (MESSAGE, hop_count, message)
    announce(payload)

def every_round():
    current_round += 1
    
    for payload_type, sender_hop_count, message in received_announcements:
        if payload_type == MESSAGE:
            if not heard:
                heard = True
                hop_count = sender_hop_count + 1
                finish_discovery_round = current_round + 2
                payload = (MESSAGE, hop_count, message)
                announce(payload)
                # Optional: Start a task here
            elif sender_hop_count > hop_count: # A MESSAGE from a lower hop count must be a child
                children_count += 1
        elif payload_type == ECHO and sender_hop_count > hop_count:
            echoes_received += 1
    
    # Optional: add in a check below for tasks being complete
    if heard and current_round > finish_discovery_round and echoes_received == children_count:
        if leader:
            terminated = True
        else:
            payload = (ECHO, hop_count, None)
            announce(payload)
```

</details>

This does rely on round-based communication, which is not as general as the asynchronous case. If you can bound the time a message might take in an asynchronous setting (which in many cases is a realistic assumption), then you can use that bound to very slightly modify this algorithm.

__Overview__: Let the upper bound of a communication be called $t_{upper}$. The leader flood-fills an init message with an attached hop-count flag, which allows each node to know how far it is from the leader. This also allows nodes to count how many children (nodes farther from the leader) they are neighbors to by listening over the next $2 t_{upper}$ time for messages being announced. When a node has completed its task and has heard an echo from all of its children (or has no children), it announces an echo to its parent. This means once the leader hears an echo from all of its children that the leader knows all the nodes in the network have heard the broadcast and completed their tasks.

| Movement | Sync Model           | Identification | Knowledge of N | Termination | Algorithm (Space, Time)                    |
| -------- | -------------------- | -------------- | -------------- | ----------- | ------------------------------------------ |
| Static   | Bounded Asynchronous | Anonymous      | Unknown        | Explicit    | Anonymous Echo Broadcast (O(log(n)), O(n)) |


<details markdown=1><summary markdown="span">
Pseudo-code
</summary>

``` python
heard = False
hop_count = None
children_count = 0
echoes_received = 0
discover_deadline = None
terminated = False

def leader_init(message):
    heard = True
    hop_count = 0
    payload = (MESSAGE, hop_count, message)
    announce(payload)
    discover_deadline = current_time() + 2*t_upper

def on_receive_announcement(payload):
    payload_type, sender_hop_count, message = payload

    if payload_type == MESSAGE:
        if not heard:
            heard = True
            hop_count = sender_hop_count + 1
            payload = (MESSAGE, hop_count, message)
            announce(payload)
            discover_deadline = current_time() + 2*t_upper
        elif sender_hop_count > hop_count:
            children_count += 1
    elif payload_type == ECHO and sender_hop_count > hop_count:
        echoes_received += 1

def on_timer():
    if heard and current_time() >= discover_deadline and echoes_received == children_count:
        if leader:
            terminated = True
        else:
            payload = (ECHO, hop_count, None)
            announce(payload)
```

</details>

If we can't bound the time a message can take to send in the asynchronous anonymous case, then it is impossible to have a terminating broadcast. Here is why: Imagine a leader node announces a message to start off the broadcast and doesn't hear back for a very long time. The leader can't tell if it's not hearing back because there aren't any other nodes in the network, or if the message is just taking a very long time to send. Note that this result also tells us we can never have a terminating broadcast for the more general case of a network that is anonymous, asynchronous, and has an unknown n.

Maybe it's possible if we know $n$? But no, even if we did know $n$, [it has been proven](https://static.aminer.org/pdf/PDF/000/451/420/symmetry_breaking_in_anonymous_networks_characterizations.pdf) that it is still impossible to construct an explicitly terminating broadcast for anonymous asynchronous networks. Since an explicitly terminating broadcast is not possible in unbounded asynchronous static networks, we know that next we must loosen our assumption to non-anonymous networks.


| Movement | Sync Model   | Identification | Knowledge of N | Termination | Algorithm (Space, Time) |
| -------- | ------------ | -------------- | -------------- | ----------- | ----------------------- |
| Static   | Asynchronous | Anonymous      | Known          | Explicit    | Impossible              |

For this last static algorithm, we will allow nodes to locally distinguish their neighbors using what we call port numbers (imagine each neighbor sends its messages to a different port on a receiving node).

This is a well-known algorithm that was independently developed at the same time by Dijkstra in [Termination Detection for Diffusing Computations](https://www.cs.utexas.edu/~EWD/ewd06xx/EWD687a.PDF) and Ernest J. H. Chang in [Echo Algorithms: Depth Parallel Operations on General Graphs](https://www.cs.mcgill.ca/~carl/depthparallel.pdf). It does not require any knowledge of the number of nodes $n$, so is fairly general. It looks very similar to __Anonymous Echo Broadcast__, but is capable of functioning in asynchronous networks.

### Echo Broadcast

__Overview__: The leader flood-fills an init message, which allows each node to select the first node they hear from as their parent. When a node hears an echo back from all of its neighbors (other than the parent) then it can echo back to its own parent. Nodes will immediately echo back inits from other nodes which are not their parent, ensuring that the other nodes will only be waiting on their children and not all their neighbors.

| Movement | Sync Model   | Identification | Knowledge of N | Termination | Algorithm (Space, Time)          |
| -------- | ------------ | -------------- | -------------- | ----------- | -------------------------------- |
| Static   | Asynchronous | Port IDs       | Unknown        | Explicit    | Echo Broadcast (O(log(n)), O(n)) |


<details markdown=1><summary markdown="span">
Pseudo-code
</summary>

``` python
heard = False
expected_children = 0
received_echos = 0
parent = None

def leader_init(message):
    # Optional: Start task here
    payload = (INIT, message)
    for neighbor in neighbors:
        send_to(neighbor, payload)
        expected_children += 1

def on_receive_payload(from_neighbor, payload):
    message_type, message = payload

    if message_type == INIT:
        if not heard:
            heard = True
            parent = from_neighbor
            # Optional: Start task here
            for neighbor in neighbors excluding parent:
                send_to(neighbor, (INIT, message))
                expected_children += 1
        else:
            send_to(from_neighbor, (ECHO, None)) # Immediately echo back to non-parents
    elif message_type == ECHO:
        received_echos += 1
        if received_echos == expected_children:
            # Optional: Defer the echo/termination until the task is complete
            if leader:
                terminated = True
            else:
                send_to(parent, (ECHO, None))
```

</details>

And this completely fills out our table for terminating broadcast algorithms in static ad-hoc networks.

Note again that the __Anonymous Echo Broadcast__ is more general than __Keep-alive Broadcast__ and __Bounded Broadcast__, and so it subsumes them. Also note that the impossibility result for when $n$ is known also applies to when $n$ is not known since it was proved impossible _even_ when you know n. When considering the generality of an environment, the order from least general to most general is 
* Static < Dynamic
* Rounds < Bounded Asynchronous < Asynchronous
* Sequential IDs < IDs < Port IDs < Anonymous
* Known N < Closely bounded N < Unknown N
* Stabilizing < Explicit

Which means the table below covers all possible static environments.

| Movement | Sync Model           | Identification | Knowledge of N | Termination | Algorithm (Space, Time)                    |
| -------- | -------------------- | -------------- | -------------- | ----------- | ------------------------------------------ |
| Static   | Bounded Asynchronous | Anonymous      | Unknown        | Explicit    | Anonymous Echo Broadcast (O(log(n)), O(n)) |
| Static   | Asynchronous         | Port IDs       | Unknown        | Explicit    | Echo Broadcast (O(log(n)), O(n))           |
| Static   | Asynchronous         | Anonymous      | Known          | Explicit    | Impossible (, )                            |
| Static   | Asynchronous         | Anonymous      | Unknown        | Stabilizing | Amnesiac Broadcast (O(1), O(n))            |


## Dynamic network

Dynamic networks are much more difficult than static ones, but also much more interesting, as we will see in a moment. 

There are multiple models of dynamic networks, of which you can investigate in [Time-varying graphs and dynamic networks](https://hal.science/hal-00847001/document), but for this overview we will keep it fairly simple. _We assume the network is connected at every point in time and that links always exist long enough to send a message_. This is a very strong satement, one worth breaking at a later date if we want to explore more realistic networks. For asynchronous communication, we assume a link lasts long enough to send at least a single message after a link is established, and for round-based communication we assume that links stay constant within a round and may change between rounds.

We start with the easiest algorithm, but also the worst algorithm, as it doesn't terminate at all. 

### Forever Broadcast

__Overview__: The leader announces the broadcast message to begin the broadcast. When a node hears the message or when a neighborhood changes, the node will re-announce the message. Eventually everyone will hear the broadcast.

| Movement | Sync Model   | Identification | Knowledge of N | Termination | Algorithm (Space, Time)        |
| -------- | ------------ | -------------- | -------------- | ----------- | ------------------------------ |
| Dynamic  | Asynchronous | Anonymous      | Unknown        | None        | Forever Broadcast (O(1), O(n)) |


<details markdown=1><summary markdown="span">
Pseudo-code
</summary>

``` python
heard = False

def leader_init(message):
    heard = True
    announce(message)

def on_receive_announcement(message):
    if not heard:
        heard = True
        announce(message)

def neighborhood_change():
    if heard:
        announce(message)
```

</details>

This is a poor broadcast algorithm. Although it is correct (it guarantees everyone receives the broadcast), it doesn't terminate.

A slightly better algorithm that at least terminates under the same environment is below, but it only gets us to a stabilizing termination.

### [Countdown Broadcast](https://arxiv.org/pdf/2407.09714)

__Overview__: The leader sends out a message with two values attached: the maximum number of rounds for the message to be kept alive, and the number of rounds the message has left to live. After a node receives a message, they continue to announce the message for the remaining number of rounds. If a node receives the message for the first time where the remaining rounds are 0, then they set their maximum keep-alive value to twice what the message contains and they reset the lifetime of the message to the newly doubled maximum. This essentially allows a broadcast to restart over and over with doubling lifetimes until it lasts long enough to reach every node and stop being restarted.  

| Movement | Sync Model | Identification | Knowledge of N | Termination | Algorithm (Space, Time)               |
| -------- | ---------- | -------------- | -------------- | ----------- | ------------------------------------- |
| Dynamic  | Rounds     | Anonymous      | Unknown        | Stabilizing | Countdown Broadcast (O(log(n)), O(n)) |


<details markdown=1><summary markdown="span">
Pseudo-code
</summary>

``` python
active = False
broadcast_maximum = None
broadcast_countdown = None

def leader_init(message):
    active = False # The leader immediately goes back to being idle after the first round
    broadcast_maximum = 1
    broadcast_countdown = 0
    payload = (broadcast_maximum, broadcast_countdown, message)
    announce(payload)

def every_round():
    if received_announcements: # if there are multiple payloads, they will be identical
        payload = received_announcements[0]
        if not active:
            active = True
            broadcast_maximum, broadcast_countdown, message = payload
            if broadcast_countdown == 0:
                broadcast_countdown = 2*broadcast_maximum
                broadcast_maximum = 2*broadcast_maximum

    if active and broadcast_countdown > 0:
        broadcast_countdown -= 1
        payload = (broadcast_maximum, broadcast_countdown)
        announce(payload)
        if broadcast_countdown == 0:
            active = False # go back to idle for now, although we may hear another broadcast later
```

</details>

This algorithm came from the paper [Memory Lower Bounds and Impossibility Results for Anonymous Dynamic Broadcast](https://arxiv.org/pdf/2407.09714), which also provides some _powerful_ statements. One important theorem from this paper states: 

* __Theorem__: For dynamic, anonymous, round-based, unknown n networks, no explicitly terminating broadcast is possible. 

This is a fairly strong statement, especially when we consider that impossibility proofs are more powerful the more restrictive the assumptions are, as that means the impossibility proof also applies to the less restrictive assumptions. This proof tells us that in dynamic anonymous networks we can't have a terminating broadcast, regardless of the synchronicity of communication. This means for the environment we've been looking at with the last two algorithms there does not exist an explicitly terminating algorithm.

| Movement | Sync Model | Identification | Knowledge of N | Termination | Algorithm (Space, Time) |
| -------- | ---------- | -------------- | -------------- | ----------- | ----------------------- |
| Dynamic  | Rounds     | Anonymous      | Unknown        | Explicit    | Impossible (, )         |

This means we need to move on to a less general setting and see where we can find explicitly terminating broadcasts. 

We will see now that the __Bounded Broadcast__ from the static network setting happens to apply to this dynamic setting, and provides us with our first explicitly terminating broadcast, but only in the round-based communication model with a closely bounded n.

### Dynamic Bounded Broadcast

__Overview__: Let us call the close upper bound of $n$ to be $n_{upper}$. The leader announces the broadcast message to begin, then anyone who hears the message will set their state to "heard" and starts to announce to their neighbors. Every node announces for $n_{upper}$ rounds, and then terminates. So eventually, after $n_{upper}$ rounds, everyone will have heard the message, and after $2 n_{upper}$ rounds everyone will have terminated.

| Movement | Sync Model | Identification | Knowledge of N  | Termination | Algorithm (Space, Time)                     |
| -------- | ---------- | -------------- | --------------- | ----------- | ------------------------------------------- |
| Dynamic  | Anonymous  | Rounds         | Closely bounded | Explicit    | Dynamic Bounded Broadcast (O(log(n)), O(n)) |


<details markdown=1><summary markdown="span">
Pseudo-code
</summary>

``` python
heard = False
terminating_round = None

def leader_init(message):
    heard = True
    terminating_round = current_round + 2*n_upper
    announce(message)

def every_round():    
    if message in received_announcements:
        if not heard:
            heard = True
            terminating_round = current_round + n_upper
    
    if heard:
        if current_round < terminating_round:
            announce(message)
        elif leader and current_round >= terminating_round:
            terminated = True
```

</details>

This is nearly identical to the static setting, and is still correct since we assume the network is connected every round. This assumption means that there is at least one link somewhere connecting the nodes that have heard the broadcast to those that have not (if there wasn't, then the network would be disconnected), and that means each round that at least one new node will hear the broadcast.

We can do without the round-based communication if the asynchronous communication is bounded. We just need each node to communicate for $t_{upper} n_{upper}$ time, announcing upon first hearing the message and on every neighborhood change within the bounded time.

__Overview__: Let us call the close upper bound of $n$ to be $n_{upper}$ and the upper bound on communication to be $t_{upper}$. The leader announces the broadcast message to begin the process, and announces on every neighborhood change. Each node also announces the message upon first hearing it and on every neighborhood change. Every node announces for $t_{upper} n_{upper}$ time, and then terminates. So eventually, after $t_{upper} n_{upper}$ time, everyone will have heard the message, and after $2 t_{upper} n_{upper}$ time everyone will have terminated.

| Movement | Sync Model           | Identification | Knowledge of N  | Termination | Algorithm (Space, Time)                     |
| -------- | -------------------- | -------------- | --------------- | ----------- | ------------------------------------------- |
| Dynamic  | Bounded Asynchronous | Anonymous      | Closely bounded | Explicit    | Dynamic Bounded Broadcast (O(log(n)), O(n)) |

<details markdown=1><summary markdown="span">
Pseudo-code
</summary>

``` python
heard = False
termination_time = None
terminated = False

def leader_init(message):
    heard = True
    announce(message)
    termination_time = current_time() + 2 * t_upper * n_upper

def on_receive_announcement(message):
    if not heard:
        heard = True
        announce(message)
        termination_time = current_time() + t_upper * n_upper

def neighborhood_change():
    if heard and current_time() < termination_time:
        announce(message_cache)

def on_timer():
    if leader and heard and current_time() >= termination_time:
        terminated = True
```

</details>

Note that for every asynchronous communication model (includes bounded asynchronous), we assume a node can detect when its list of neighbors has changed, even in Anonymous networks where a node doesn't know who or how many nodes are nearby, just that it changed. This is necessary since a node must know when to send a message for new nodes before those nodes disconnect. This is a fairly strong assumption, and dramatically decreases the feasibility of the anonymous asynchronous (both bounded and unbounded) case.

### ID-List Broadcast

__Overview__: The leader sends the initial broadcast with a list of IDs attached, initially just containing the ID of the leader. When a node receives a broadcast and an ID list, they append their own ID to the list and announce the broadcast with the new list. Nodes will also announce their list when their neighborhood changes. When the leader has as many unique IDs as the number of nodes in the network $n$, then the leader knows that the broadcast has reached every node and has terminated.

| Movement | Sync Model   | Identification | Knowledge of N | Termination | Algorithm (Space, Time)                |
| -------- | ------------ | -------------- | -------------- | ----------- | -------------------------------------- |
| Dynamic  | Asynchronous | IDs            | Known          | Explicit    | ID-List Broadcast (O(n log(n)), O(n²)) |


<details markdown=1><summary markdown="span">
Pseudo-code
</summary>

``` python
heard = False
seen_IDs = [ ID ]

def leader_init(message):
    heard = True
    payload = (message, seen_IDs)
    announce(payload)

def on_receive_announcement(payload):
    heard = True
    message, receiving_seen_IDs = payload

    if receiving_seen_IDs contains elements not in seen_IDs:
        seen_IDs.update(receiving_seen_IDs) # add in any new IDs to seen_IDs

        if leader and len(seen_IDs) == n:
            terminated = True

        payload = (message, seen_IDs)
        announce(payload)

def neighborhood_change():
    payload = (message, seen_IDs)
    announce(payload)
```

</details>

This is quite memory-inefficient since every node has to store the ID of every other node, but it does at least provide explicit termination. Except, it only guarantees termination for the leader node, all the other nodes will run forever. If we had a stabilizing algorithm for this environment, we could use that to alert the other nodes that the broadcast has terminated. But we do not, and so the algorithm is not as strong as it could be. This one important dimension to add to the table of environments at some point.

But now let's see what we can do when we don't even have an upper bound on $n$. We already know we will need to break some assumption, so we will have either bounded asynchronous communication or IDs of some kind. But even then, we won't find an explicit termination.

The next few algorithms are taken from [Information Dissemination in Highly Dynamic Graphs](https://sci-hub.ru/10.1145/1080810.1080828). The communication model here is subtly different from our current bounded asynchronous model, but critically different. It took some time to see how there was a difference.

We had assumed that there is some upper bound which a message will take to send, and that a link will always last long enough to receive the message. This means a link could disappear quickly if the message successfully sent quickly. For example, if the upper bound is 10 seconds, and a message is sent in 2 seconds, then it is ok if the link disappears after 5 seconds. In this more restrictive asynchronous model we assume the links cannot disappear for $t_{upper}$ time regardless of how long the message actually takes to send. This means even if a message is received after 2 seconds, the link still cannot disappear until after the full 10 seconds.

### [Counter-Flooding Broadcast](https://sci-hub.ru/10.1145/1080810.1080828)

__Overview__: The leader sends the initial broadcast to initialize the process. Every node keeps a counter $k$ that gets incremented every time a neighborhood change occurs and they re-announce the message. It can be proven that within $2 n_{upper}$ broadcasts, every node will receive the message. 

| Movement | Sync Model           | Identification | Knowledge of N  | Termination | Algorithm (Space, Time)                      |
| -------- | -------------------- | -------------- | --------------- | ----------- | -------------------------------------------- |
| Dynamic  | Bounded Asynchronous | Anonymous      | Closely bounded | Stabilizing | Counter-Flooding Broadcast (O(log(n)), O(n)) |
        
<details markdown=1><summary markdown="span">
Pseudo-code
</summary>

``` python
heard = False
counter = 0

def leader_init(message):
    heard = True
    counter += 1
    announce(message)

def on_receive_announcement(message):
    if not heard:
        heard = True
        counter += 1
        announce(message)

def neighborhood_change():
    if heard and counter < 2*n_upper:
        counter += 1
        announce(message)
```

</details>

Although $t_{upper}$ is not seen in this algorithm, the proof of termination depends on the fact that each link must exist for at least $t_{upper}$ time. This is actually a weaker version of __Dynamic Bounded Broadcast__ due to the fact that this algorithm depends on the stronger assumption that links persist for a minimum duration (t), not just that messages are delivered within bounded time. But we include it here for completeness.

### [List-Flooding Broadcast](https://sci-hub.ru/10.1145/1080810.1080828)

__Overview__: Every node approximates the network size by keeping track of the number of unique IDs it's seen, overapproximating by 1 to ensure it can hear from any nodes it hasn't already heard from, then using that value to run the __Counter Flooding__ algorithm from above.

| Movement | Sync Model           | Identification | Knowledge of N | Termination | Algorithm (Space, Time)                      |
| -------- | -------------------- | -------------- | -------------- | ----------- | -------------------------------------------- |
| Dynamic  | Bounded Asynchronous | IDs            | Unknown        | Stabilizing | List-Flooding Broadcast (O(n log(n)), O(n²)) |


<details markdown=1><summary markdown="span">
Pseudo-code
</summary>

``` python
heard = False
seen_IDs = [ ID ]
approximate_network_size = 1
counter = 0

def leader_init(message):
    heard = True
    counter += 1
    payload = (message, seen_IDs)
    announce(payload)

def on_receive_announcement(payload):
    message, received_seen_IDs = payload

    if received_seen_IDs contains elements not in seen_IDs:
        seen_IDs.update(received_seen_IDs) # add in new IDs to seen_IDs
        # restart the Counter Flooding Broadcast
        heard = False
        counter = 0
        approximate_network_size = len(seen_IDs) + 1

    if not heard:
        heard = True
        counter += 1
        payload = (message, seen_IDs)
        announce(payload)

def neighborhood_change():
    if heard and counter < 2*n_upper:
        counter += 1
        payload = (message, seen_IDs)
        announce(payload)
```

</details>

This uses a lot of memory, but if the IDs are sequential, then we could approximate the network size using the largest seen ID.

### [Sequential-ID Flooding Broadcast](https://sci-hub.ru/10.1145/1080810.1080828)

__Overview__: Every node approximates the network size by keeping track of the largest ID it has seen, overapproximating by 1 to ensure it can hear from any nodes it hasn't already heard from, then using that value to run the Counter Flooding algorithm from above.

| Movement | Sync Model           | Identification | Knowledge of N | Termination | Algorithm (Space, Time)                             |
| -------- | -------------------- | -------------- | -------------- | ----------- | --------------------------------------------------- |
| Dynamic  | Bounded Asynchronous | Sequential IDs | Unknown        | Stabilizing | Sequential-ID Flooding Broadcast (O(log(n)), O(n²)) |


<details markdown=1><summary markdown="span">
Pseudo-code
</summary>

``` python
heard = False
largest_seen_ID = ID
approximate_network_size = ID + 1
counter = 0

def leader_init(message):
    heard = True
    counter += 1
    payload = (message, largest_seen_ID)
    announce(payload)

def on_receive_announcement(payload):
    message, received_largest_seen_ID = payload

    if received_largest_seen_ID > largest_seen_ID:
        largest_seen_ID = received_largest_seen_ID
        # restart the Counter Flooding Broadcast
        heard = False
        counter = 0
        approximate_network_size = received_largest_seen_ID + 1

    if not heard:
        heard = True
        counter += 1
        payload = (message, largest_seen_ID)
        announce(payload)

def neighborhood_change():
    if heard and counter < 2*n_upper:
        counter += 1
        payload = (message, largest_seen_ID)
        announce(payload)
```

</details>

These algorithms work only in very specific environments, and are only providing stabilizing broadcasts. The table of broadcasts gets quite sparse in this regime of harsh environments. I suspect that with some thinking we could convert these algorithms into explicitly terminating broadcasts in the less restrictive asynchronous model by building this algorithms on __Dynamic Bounded Broadcast__ instead of __Counter-Flooding Broadcast__. 

O’Dell et al. conjecture that a stabilizing terminating broadcast is impossible for dynamic, anonymous, bounded asynchronous, unknown $n$ networks with O(log(n)) memory and message size. Parzych et al. very nearly disproved this with their __Countdown Broadcast__ algorithm; they meet all the requirements except for the bounded asynchronous requirement, they instead solve it for round-based communication.

Much of the table is left unfilled for this dynamic environment. I suspect many of these are impossible, but proofs are required.

| Movement | Sync Model           | Identification | Knowledge of N  | Termination | Algorithm (Space, Time)                      |
| -------- | -------------------- | -------------- | --------------- | ----------- | -------------------------------------------- |
| Dynamic  | Rounds               | Sequential IDs | Unknown         | Explicit    |
| Dynamic  | Rounds               | IDs            | Unknown         | Explicit    |
| Dynamic  | Rounds               | Port IDs       | Unknown         | Explicit    |
| Dynamic  | Rounds               | Anonymous      | Unknown         | Stabilizing | Countdown Broadcast (O(log(n)), O(n))        |
| Dynamic  | Rounds               | Anonymous      | Unknown         | Explicit    | Impossible                                   |
| Dynamic  | Bounded Asynchronous | Sequential IDs | Unknown         | Explicit    |
| Dynamic  | Bounded Asynchronous | IDs            | Unknown         | Stabilizing | List-Flooding Broadcast (O(n log(n)), O(n²)) |
| Dynamic  | Bounded Asynchronous | IDs            | Unknown         | Explicit    |
| Dynamic  | Bounded Asynchronous | Port IDs       | Unknown         | Stabilizing |
| Dynamic  | Bounded Asynchronous | Port IDs       | Unknown         | Explicit    |
| Dynamic  | Bounded Asynchronous | Anonymous      | Closely bounded | Explicit    | Dynamic Bounded Broadcast (O(log(n)), O(n))  |
| Dynamic  | Bounded Asynchronous | Anonymous      | Unknown         | Stabilizing |
| Dynamic  | Asynchronous         | Sequential IDs | Closely bounded | Stabilizing |
| Dynamic  | Asynchronous         | Sequential IDs | Closely bounded | Explicit    |
| Dynamic  | Asynchronous         | Sequential IDs | Unknown         | Stabilizing |
| Dynamic  | Asynchronous         | Sequential IDs | Unknown         | Explicit    |
| Dynamic  | Asynchronous         | IDs            | Known           | Explicit    | ID-List Broadcast (O(n log(n)), O(n²))       |
| Dynamic  | Asynchronous         | IDs            | Closely bounded | Stabilizing |
| Dynamic  | Asynchronous         | IDs            | Closely bounded | Explicit    |
| Dynamic  | Asynchronous         | IDs            | Unknown         | Stabilizing |
| Dynamic  | Asynchronous         | IDs            | Unknown         | Explicit    |
| Dynamic  | Asynchronous         | Port IDs       | Known           | Stabilizing |
| Dynamic  | Asynchronous         | Port IDs       | Known           | Explicit    |
| Dynamic  | Asynchronous         | Port IDs       | Closely bounded | Stabilizing |
| Dynamic  | Asynchronous         | Port IDs       | Closely bounded | Explicit    |
| Dynamic  | Asynchronous         | Port IDs       | Unknown         | Stabilizing |
| Dynamic  | Asynchronous         | Port IDs       | Unknown         | Explicit    |
| Dynamic  | Asynchronous         | Anonymous      | Known           | Stabilizing |
| Dynamic  | Asynchronous         | Anonymous      | Closely bounded | Stabilizing |
| Dynamic  | Asynchronous         | Anonymous      | Unknown         | Stabilizing |

# Next steps

Obviously the table has many more entries to be filled in, either by looking through more of the literature, or from discovering new algorithms and impossibility proofs. Please do reach out if you know a paper or algorithm to fill in more entries in the table or improve on an algorithm (or just because you made it this far in the blog post and want to say hi, I imagine we might enjoy a chat).

The full table could also easily be extended to include more detail and environments. Examples might include: unreliable links, directed networks, nodes that only know the number of neighbors they have, t-interval connected networks, differentiating all-terminating explicit broadcasts from the leader-terminating explicit broadcast we have here (although if you have a leader-terminating explicit broadcast and a stabilizing broadcast, then you can chain them to get an all-terminating explicit broadcast), and a more specific explicit termination where nodes have additional compute after receiving the broadcast and can take arbitrarily long before they're considered "terminated" (this is a sub-set of the [Distributed Termination Problem](https://www.sciencedirect.com/science/article/abs/pii/S0164121298100341)).

I would also like to add animations for each of the algorithms. I think this would help provide more intuition and provide a real implementation for people to reference.

<!-- Helpful notes:

Information Dissemination in Highly Dynamic Graphs
https://sci-hub.ru/10.1145/1080810.1080828
Dynamic, asynchronous connections, known neighbor changes, 1-interval connected
* CounterFlooding
  * anonymous, bounded asynchronous, known upper bound to n (the number of nodes)
  * Correct, Explicit Termination, O(n) time, O(log(n)) memory, O(log(n)) message size
* ListFlooding
  * IDs, bounded asynchronous, no known upper bound on n
  * Correct, Explicit Termination, O(n^2) time, O(n log(n)) memory, O(n log(n)) message size
* SeqIDFlooding
  * Sequential IDs, no known upper bound on n
  * Correct, Explicit Termination, O(n^2) time, O(log(n)) memory, , O(log(n)) message size
* Algorithm 4 - Not flood fill, but a terminating 'send' to a node with a known ID. This is interesting, but not as relevant.
* Conjecture 9 - broadcast with termination is impossible for anonymous unbounded-n networks in O(log(n)) memory. This is disproven in the next paper.

Memory Lower Bounds and Impossibility Results for Anonymous Dynamic Broadcast
https://arxiv.org/pdf/2407.09714
Dynamic, synchronous round-based, 1-interval connected
* Theorem 1: No deterministic idle-start algorithm can solve broadcast with termination detection for anonymous, synchronous, 1-interval connected dynamic networks.
* Theorem 2: Even without an idle start, no deterministic algorithm can solve broadcast with termination detection for anonymous, synchronous, 1-interval connected dynamic networks if nodes have no knowledge of the number of broadcasters.
* Theorem 3: Any algorithm that solves broadcast with termination detection for anonymous, synchronous, 1-interval connected dynamic networks must have O(log n) space complexity.
* Theorem 7: Any idle-start algorithm that solves broadcast with stabilizing termination for anonymous, synchronous, 1-interval connected dynamic networks must use ω(1) memory. ω(1) means superlinear, so > O(1).
* Countdown Algorithm
  * anonymous, no known upper bound to n, O(log(n)) memory and message size
  * Correct, Stabilizing termination, O(n) time


Huang's algorithm
https://en.wikipedia.org/wiki/Huang's_algorithm

Chapter 7: Termination Detection
https://www.cs.uic.edu/~ajayk/Chapter7.pdf

Distributed Computation in Dynamic Networks
https://dspace.mit.edu/bitstream/handle/1721.1/62565/Lynch_Distributed%20computation.pdf?sequence=1&isAllowed=y

Algorithms for distributed termination detection
https://sci-hub.ru/10.1007/bf01782776

Not totally relevant, but useful background info:



Computing in Anonymous Dynamic Networks Is Linear
https://arxiv.org/pdf/2204.02128

Symmetry Breaking in Anonymous Networks: Characterizations
https://static.aminer.org/pdf/PDF/000/451/420/symmetry_breaking_in_anonymous_networks_characterizations.pdf -->
